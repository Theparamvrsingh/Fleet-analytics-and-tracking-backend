package com.theparamvrsingh.fleetanalytics.service;

import com.theparamvrsingh.fleetanalytics.model.VehicleTrackingData;
import com.theparamvrsingh.fleetanalytics.web.dto.VehicleLocationHistoryResponse;
import com.theparamvrsingh.fleetanalytics.web.dto.VehicleLocationRequest;

import java.util.List;
import java.util.concurrent.CompletableFuture;

public interface VehicleLocationService {
    VehicleLocationHistoryResponse getVehicleLocationHistory(String reg);
    List<VehicleTrackingData> getVehicleLocations();
    CompletableFuture<Void> addVehicleLocation(VehicleLocationRequest vehicleLocationRequest);

}
