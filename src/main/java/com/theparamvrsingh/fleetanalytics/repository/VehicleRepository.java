package com.theparamvrsingh.fleetanalytics.repository;

import com.theparamvrsingh.fleetanalytics.model.Vehicle;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VehicleRepository extends MongoRepository<Vehicle, String> {
    Optional<Vehicle> findByReg(String reg);
}
