package com.theparamvrsingh.fleetanalytics.aspect;

import com.theparamvrsingh.fleetanalytics.exceptions.MissingInputFieldException;
import com.theparamvrsingh.fleetanalytics.web.dto.VehicleLocationRequest;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class VehicleLocationAspect {

    @Before("execution(* com.theparamvrsingh.fleetanalytics.service.VehicleLocationServiceImpl.addVehicleLocation(..)) && args(vehicleLocationRequest)")
    public void checkRequiredFields(JoinPoint joinPoint, VehicleLocationRequest vehicleLocationRequest) {
        if (vehicleLocationRequest.getReg()== null || vehicleLocationRequest.getReg().isEmpty())
            throw new MissingInputFieldException("Vehicle registration number is required");
        if (vehicleLocationRequest.getLat() == 0 ) {
            throw new MissingInputFieldException("Invalid latitude value. Latitude is required");
        }
        if (vehicleLocationRequest.getLon() ==0)
            throw new MissingInputFieldException("Invalid longitude value. Longitude is required");
        if (vehicleLocationRequest.getStatus() == null || vehicleLocationRequest.getStatus().isEmpty())
            throw new MissingInputFieldException("Status is required");

    }
}
