package edu.cit.lagamo.multibiz.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class BusinessRequest {

    @NotNull(message = "Owner ID is required")
    private UUID ownerId;

    @NotBlank(message = "Business name is required")
    private String name;

    @NotBlank(message = "Category is required")
    private String category;

    private String description;

    public BusinessRequest() {}

    public UUID getOwnerId() { return ownerId; }
    public void setOwnerId(UUID ownerId) { this.ownerId = ownerId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
