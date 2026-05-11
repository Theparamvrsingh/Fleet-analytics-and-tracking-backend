package com.theparamvrsingh.fleetanalytics.repository;

import com.theparamvrsingh.fleetanalytics.model.VehicleTrackingData;

import java.util.List;

public interface VehicleLocationCustomRepository {
    List<VehicleTrackingData> findLatestLocationRecordForEachReg();
    List<VehicleTrackingData> findByReg(String reg);

}
