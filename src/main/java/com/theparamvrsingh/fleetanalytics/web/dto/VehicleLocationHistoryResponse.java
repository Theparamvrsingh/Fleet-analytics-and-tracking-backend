package com.theparamvrsingh.fleetanalytics.web.dto;

import com.theparamvrsingh.fleetanalytics.model.Location;
import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class VehicleLocationHistoryResponse {
    private String reg;
    private  Location[] locations;

}
