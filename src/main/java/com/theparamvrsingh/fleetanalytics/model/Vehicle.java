package com.theparamvrsingh.fleetanalytics.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "vehicles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Vehicle {
    @Id
    private String id;
    private String reg;
    private String make;
    private String model;
    private String year;
    private String owner;
    private String status; // Active, Inactive, Maintenance
}
