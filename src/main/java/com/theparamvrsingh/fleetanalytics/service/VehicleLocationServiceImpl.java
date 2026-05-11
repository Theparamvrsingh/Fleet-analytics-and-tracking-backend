package com.theparamvrsingh.fleetanalytics.service;


import com.corundumstudio.socketio.SocketIOServer;
import com.theparamvrsingh.fleetanalytics.exceptions.MissingInputFieldException;
import com.theparamvrsingh.fleetanalytics.mapper.VehicleTrackingDataToLocation;
import com.theparamvrsingh.fleetanalytics.mapper.VehicleTrackingDataToSocketResponse;
import com.theparamvrsingh.fleetanalytics.model.VehicleTrackingData;
import com.theparamvrsingh.fleetanalytics.repository.VehicleLocationCustomRepository;
import com.theparamvrsingh.fleetanalytics.repository.VehicleLocationRepository;
import com.theparamvrsingh.fleetanalytics.web.dto.VehicleLocationHistoryResponse;
import com.theparamvrsingh.fleetanalytics.web.dto.VehicleLocationRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
public class VehicleLocationServiceImpl implements VehicleLocationService {

    private final VehicleLocationRepository vehicleLocationRepository;
    private final VehicleLocationCustomRepository vehicleLocationCustomRepository;
    private final SocketIOServer socketIOServer;


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

        VehicleTrackingData vehicleTrackingData = VehicleTrackingData.builder()
                .lat(vehicleLocationRequest.getLat())
                .lon(vehicleLocationRequest.getLon())
                .status(vehicleLocationRequest.getStatus())
                .reg(vehicleLocationRequest.getReg())
                .timestamp(LocalDateTime.now())
                .build();
        vehicleLocationRepository.save(vehicleTrackingData);

        socketIOServer.getBroadcastOperations().sendEvent("location", VehicleTrackingDataToSocketResponse.mapList(getVehicleLocations()));
        return CompletableFuture.completedFuture(null);
    }



}
