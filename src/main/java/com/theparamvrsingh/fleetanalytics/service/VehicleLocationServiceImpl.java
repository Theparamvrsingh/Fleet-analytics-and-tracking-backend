package com.theparamvrsingh.fleetanalytics.service;


import com.theparamvrsingh.fleetanalytics.mapper.VehicleTrackingDataToLocation;
import com.theparamvrsingh.fleetanalytics.mapper.VehicleTrackingDataToSocketResponse;
import com.theparamvrsingh.fleetanalytics.model.VehicleTrackingData;
import com.theparamvrsingh.fleetanalytics.repository.VehicleLocationCustomRepository;
import com.theparamvrsingh.fleetanalytics.repository.VehicleLocationRepository;
import com.theparamvrsingh.fleetanalytics.web.dto.VehicleLocationHistoryResponse;
import com.theparamvrsingh.fleetanalytics.web.dto.VehicleLocationRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
public class VehicleLocationServiceImpl implements VehicleLocationService {

    private final VehicleLocationRepository vehicleLocationRepository;
    private final VehicleLocationCustomRepository vehicleLocationCustomRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private static final double MAX_SPEED_KPH = 80.0;

    @Override
    public VehicleLocationHistoryResponse getVehicleLocationHistory(String reg) {
        List<VehicleTrackingData> vehicleTrackingData = vehicleLocationCustomRepository.findByReg(reg);
        return VehicleLocationHistoryResponse.builder()
                .reg(reg)
                .locations(VehicleTrackingDataToLocation.map(vehicleTrackingData))
                .build();
    }

    @Override
    public List<VehicleTrackingData> getVehicleLocations() {
        return vehicleLocationCustomRepository.findLatestLocationRecordForEachReg();
    }

    @Override
    @Async("asyncExecutor")
    public CompletableFuture<Void> addVehicleLocation(VehicleLocationRequest vehicleLocationRequest) {
        LocalDateTime now = LocalDateTime.now();
        
        // Find previous location to calculate speed
        List<VehicleTrackingData> previousPoints = vehicleLocationCustomRepository.findByReg(vehicleLocationRequest.getReg());
        Double speed = 0.0;
        String alertMessage = null;
        String status = vehicleLocationRequest.getStatus();

        if (!previousPoints.isEmpty()) {
            VehicleTrackingData prev = previousPoints.get(0);
            speed = calculateSpeed(prev.getLat(), prev.getLon(), prev.getTimestamp(),
                    vehicleLocationRequest.getLat(), vehicleLocationRequest.getLon(), now);
            
            // Anomaly Detection: Speeding
            if (speed > MAX_SPEED_KPH) {
                status = "Alert";
                alertMessage = String.format("Speeding detected: %.1f km/h", speed);
            }
            
            // Anomaly Detection: Geofencing (Example Restricted Zone)
            if (isInsideRestrictedZone(vehicleLocationRequest.getLat(), vehicleLocationRequest.getLon())) {
                status = "Alert";
                alertMessage = "Restricted Zone Breach: Industrial Area 4";
            }
        }

        VehicleTrackingData vehicleTrackingData = VehicleTrackingData.builder()
                .lat(vehicleLocationRequest.getLat())
                .lon(vehicleLocationRequest.getLon())
                .status(status)
                .reg(vehicleLocationRequest.getReg())
                .timestamp(now)
                .speed(speed)
                .alertMessage(alertMessage)
                .build();
        vehicleLocationRepository.save(vehicleTrackingData);

        messagingTemplate.convertAndSend("/topic/location", VehicleTrackingDataToSocketResponse.mapList(getVehicleLocations()));
        return CompletableFuture.completedFuture(null);
    }

    private Double calculateSpeed(double lat1, double lon1, LocalDateTime time1,
                                 double lat2, double lon2, LocalDateTime time2) {
        double R = 6371; // Earth radius
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = R * c;

        long seconds = Duration.between(time1, time2).getSeconds();
        if (seconds < 5) return 0.0; // Minimum interval to trust speed calculation
        
        double hours = seconds / 3600.0;
        return distance / hours;
    }

    private boolean isInsideRestrictedZone(double lat, double lon) {
        // Mock Restricted Zone (approximate coordinates for a specific spot)
        double zoneLat = 18.5204;
        double zoneLon = 73.8567;
        double radiusKm = 0.5; // 500 meters

        double dLat = Math.toRadians(lat - zoneLat);
        double dLon = Math.toRadians(lon - zoneLon);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat)) * Math.cos(Math.toRadians(zoneLat)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return (6371 * c) < radiusKm;
    }

}
