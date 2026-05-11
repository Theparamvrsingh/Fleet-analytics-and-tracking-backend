package com.theparamvrsingh.fleetanalytics;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class FleetAnalyticsTrackingBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(FleetAnalyticsTrackingBackendApplication.class, args);
    }


}
