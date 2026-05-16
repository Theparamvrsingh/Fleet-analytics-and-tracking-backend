package com.theparamvrsingh.fleetanalytics.service;

import com.theparamvrsingh.fleetanalytics.model.Vehicle;
import com.theparamvrsingh.fleetanalytics.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;

    public Vehicle addVehicle(Vehicle vehicle) {
        return vehicleRepository.save(vehicle);
    }

    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findAll();
    }

    public Vehicle getVehicleByReg(String reg) {
        return vehicleRepository.findByReg(reg)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with reg: " + reg));
    }

    public void deleteVehicle(String id) {
        vehicleRepository.deleteById(id);
    }
}
