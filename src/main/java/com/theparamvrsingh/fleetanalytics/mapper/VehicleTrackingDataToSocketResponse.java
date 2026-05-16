package com.theparamvrsingh.fleetanalytics.mapper;

import com.theparamvrsingh.fleetanalytics.model.VehicleTrackingData;
import com.theparamvrsingh.fleetanalytics.web.dto.SocketIOVehicleTrackingDataResponse;

import java.util.List;

public class VehicleTrackingDataToSocketResponse {
    public static List<SocketIOVehicleTrackingDataResponse> mapList(List<VehicleTrackingData> vehicleTrackingData) {
        List<SocketIOVehicleTrackingDataResponse> socketIOVehicleTrackingDataResponses =  new java.util.ArrayList<>();
        assert vehicleTrackingData != null;
        for (VehicleTrackingData data : vehicleTrackingData) {
            socketIOVehicleTrackingDataResponses.add(SocketIOVehicleTrackingDataResponse.builder()
                    .id(data.getId())
                    .lat(data.getLat())
                    .lon(data.getLon())
                    .status(data.getStatus())
                    .timestamp(data.getTimestamp().toString())
                    .reg(data.getReg())
                    .speed(data.getSpeed())
                    .alertMessage(data.getAlertMessage())
                    .build());
        }
        return socketIOVehicleTrackingDataResponses;
    }
}
