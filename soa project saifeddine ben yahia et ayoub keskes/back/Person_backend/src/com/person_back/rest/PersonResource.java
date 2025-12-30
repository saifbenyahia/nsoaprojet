package com.person_back.rest;

import com.person_back.dao.PersonDAO;
import com.person_back.model.Person;

import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


@Path("/persons")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PersonResource {
    
    private final PersonDAO dao = new PersonDAO();
    private static final SimpleDateFormat DATE_FORMAT = new SimpleDateFormat("yyyy-MM-dd");

    
    @OPTIONS
    public void options() {
        // Jersey will automatically return 200 OK
        // CORSFilter will add headers
    }
    /**
     * GET all persons
     * GET /persons
     */
    @GET
    public Response getAll() {
        try {
            List<Person> persons = dao.findAll();
            return Response.ok(persons).build();
        } catch (Exception e) {
            return buildErrorResponse("Error retrieving persons: " + e.getMessage());
        }
    }

    /**
     * GET person by ID
     * GET /persons/{id}
     */
    @GET
    @Path("/{id}")
    public Response getById(@PathParam("id") Long id) {
        try {
            Person person = dao.findById(id);
            if (person == null) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity(createErrorMap("Person with id " + id + " not found"))
                        .build();
            }
            return Response.ok(person).build();
        } catch (Exception e) {
            return buildErrorResponse("Error retrieving person: " + e.getMessage());
        }
    }

    /**
     * Search persons by name
     * GET /persons/search?name=value
     */
    @GET
    @Path("/search")
    public Response searchByName(@QueryParam("name") String name) {
        try {
            if (name == null || name.trim().isEmpty()) {
                return buildErrorResponse("Search parameter 'name' is required");
            }
            List<Person> persons = dao.findByName(name);
            return Response.ok(persons).build();
        } catch (Exception e) {
            return buildErrorResponse("Error searching persons: " + e.getMessage());
        }
    }

    /**
     * Search persons by department
     * GET /persons/department?name=value
     */
    @GET
    @Path("/department")
    public Response searchByDepartment(@QueryParam("name") String departement) {
        try {
            if (departement == null || departement.trim().isEmpty()) {
                return buildErrorResponse("Query parameter 'name' is required");
            }
            List<Person> persons = dao.findByDepartement(departement);
            return Response.ok(persons).build();
        } catch (Exception e) {
            return buildErrorResponse("Error searching persons by department: " + e.getMessage());
        }
    }

    /**
     * Create new person
     * POST /persons
     */
    @POST
    public Response create(Person person) {
        try {
            // Validate required fields
            String validationError = validatePersonForCreate(person);
            if (validationError != null) {
                return buildErrorResponse(validationError);
            }

            // Validate date format if provided
            if (person.getDateEmbauche() != null && !person.getDateEmbauche().trim().isEmpty()) {
                if (!isValidDate(person.getDateEmbauche())) {
                    return buildErrorResponse("Invalid date format for dateEmbauche. Use yyyy-MM-dd");
                }
            }

            // Check if email already exists
            if (dao.existsByEmail(person.getEmail())) {
                return buildErrorResponse("Email '" + person.getEmail() + "' already exists");
            }

            dao.create(person);
            return Response.status(Response.Status.CREATED)
                    .entity(person)
                    .build();
        } catch (Exception e) {
            return buildErrorResponse("Error creating person: " + e.getMessage());
        }
    }

    /**
     * Full update - replaces all fields
     * PUT /persons/{id}
     */
    @PUT
    @Path("/{id}")
    public Response fullUpdate(@PathParam("id") Long id, Person person) {
        try {
            Person existing = dao.findById(id);
            if (existing == null) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity(createErrorMap("Person with id " + id + " not found"))
                        .build();
            }

            // Validate incoming data
            String validationError = validatePersonForUpdate(person);
            if (validationError != null) {
                return buildErrorResponse(validationError);
            }

            // Validate date format if provided
            if (person.getDateEmbauche() != null && !person.getDateEmbauche().trim().isEmpty()) {
                if (!isValidDate(person.getDateEmbauche())) {
                    return buildErrorResponse("Invalid date format for dateEmbauche. Use yyyy-MM-dd");
                }
            }

            // Check email uniqueness (if changed)
            if (!existing.getEmail().equalsIgnoreCase(person.getEmail()) && 
                dao.existsByEmailExcludingId(person.getEmail(), id)) {
                return buildErrorResponse("Email '" + person.getEmail() + "' already exists");
            }

            // Update all fields
            existing.setName(person.getName());
            existing.setAge(person.getAge());
            existing.setNom(person.getNom());
            existing.setPrenom(person.getPrenom());
            existing.setEmail(person.getEmail());
            existing.setTelephone(person.getTelephone());
            existing.setPoste(person.getPoste());
            existing.setDepartement(person.getDepartement());
            existing.setDateEmbauche(person.getDateEmbauche());

            dao.update(existing);
            return Response.ok(existing).build();
        } catch (Exception e) {
            return buildErrorResponse("Error updating person: " + e.getMessage());
        }
    }

    /**
     * Partial update - updates only provided fields
     * PATCH /persons/{id}
     */
    @PATCH
    @Path("/{id}")
    public Response partialUpdate(@PathParam("id") Long id, Map<String, Object> updates) {
        try {
            Person existing = dao.findById(id);
            if (existing == null) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity(createErrorMap("Person with id " + id + " not found"))
                        .build();
            }

            if (updates == null || updates.isEmpty()) {
                return buildErrorResponse("No fields provided for update");
            }

            boolean hasUpdates = false;

            // Update name
            if (updates.containsKey("name")) {
                String name = getString(updates.get("name"));
                if (name == null || name.trim().isEmpty()) {
                    return buildErrorResponse("Name cannot be empty");
                }
                existing.setName(name.trim());
                hasUpdates = true;
            }

            // Update age
            if (updates.containsKey("age")) {
                try {
                    Integer age = getInteger(updates.get("age"));
                    if (age == null || age <= 0) {
                        return buildErrorResponse("Age must be a positive number");
                    }
                    existing.setAge(age);
                    hasUpdates = true;
                } catch (NumberFormatException e) {
                    return buildErrorResponse("Invalid age format");
                }
            }

            // Update nom
            if (updates.containsKey("nom")) {
                String nom = getString(updates.get("nom"));
                if (nom == null || nom.trim().isEmpty()) {
                    return buildErrorResponse("Nom cannot be empty");
                }
                existing.setNom(nom.trim());
                hasUpdates = true;
            }

            // Update prenom
            if (updates.containsKey("prenom")) {
                String prenom = getString(updates.get("prenom"));
                if (prenom == null || prenom.trim().isEmpty()) {
                    return buildErrorResponse("Prenom cannot be empty");
                }
                existing.setPrenom(prenom.trim());
                hasUpdates = true;
            }

            // Update email
            if (updates.containsKey("email")) {
                String email = getString(updates.get("email"));
                if (email == null || email.trim().isEmpty()) {
                    return buildErrorResponse("Email cannot be empty");
                }
                if (!isValidEmail(email)) {
                    return buildErrorResponse("Invalid email format");
                }
                // Check uniqueness
                if (!existing.getEmail().equalsIgnoreCase(email) && 
                    dao.existsByEmailExcludingId(email, id)) {
                    return buildErrorResponse("Email '" + email + "' already exists");
                }
                existing.setEmail(email.trim());
                hasUpdates = true;
            }

            // Update telephone
            if (updates.containsKey("telephone")) {
                existing.setTelephone(getString(updates.get("telephone")));
                hasUpdates = true;
            }

            // Update poste
            if (updates.containsKey("poste")) {
                existing.setPoste(getString(updates.get("poste")));
                hasUpdates = true;
            }

            // Update departement
            if (updates.containsKey("departement")) {
                existing.setDepartement(getString(updates.get("departement")));
                hasUpdates = true;
            }

            // Update dateEmbauche
            if (updates.containsKey("dateEmbauche")) {
                String dateStr = getString(updates.get("dateEmbauche"));
                if (dateStr != null && !dateStr.trim().isEmpty()) {
                    if (!isValidDate(dateStr)) {
                        return buildErrorResponse("Invalid date format. Use yyyy-MM-dd (e.g., 2024-01-15)");
                    }
                    existing.setDateEmbauche(dateStr);
                    hasUpdates = true;
                } else {
                    existing.setDateEmbauche(null);
                    hasUpdates = true;
                }
            }

            if (!hasUpdates) {
                return buildErrorResponse("No valid fields provided for update");
            }

            dao.update(existing);
            return Response.ok(existing).build();
        } catch (Exception e) {
            return buildErrorResponse("Error updating person: " + e.getMessage());
        }
    }

    /**
     * Delete person by ID
     * DELETE /persons/{id}
     */
    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        try {
            Person existing = dao.findById(id);
            if (existing == null) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity(createErrorMap("Person with id " + id + " not found"))
                        .build();
            }

            dao.delete(id);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Person deleted successfully");
            response.put("id", id.toString());
            
            return Response.ok(response).build();
        } catch (Exception e) {
            return buildErrorResponse("Error deleting person: " + e.getMessage());
        }
    }

    /**
     * Get total count of persons
     * GET /persons/count
     */
    @GET
    @Path("/count")
    public Response getCount() {
        try {
            long count = dao.count();
            Map<String, Long> response = new HashMap<>();
            response.put("count", count);
            return Response.ok(response).build();
        } catch (Exception e) {
            return buildErrorResponse("Error counting persons: " + e.getMessage());
        }
    }

    // ==================== HELPER METHODS ====================

    /**
     * Validate person data for creation
     */
    private String validatePersonForCreate(Person person) {
        if (person == null) {
            return "Person data is required";
        }
        if (person.getName() == null || person.getName().trim().isEmpty()) {
            return "Name is required";
        }
        if (person.getAge() == null || person.getAge() <= 0) {
            return "Age must be a positive number";
        }
        if (person.getNom() == null || person.getNom().trim().isEmpty()) {
            return "Nom (last name) is required";
        }
        if (person.getPrenom() == null || person.getPrenom().trim().isEmpty()) {
            return "Prenom (first name) is required";
        }
        if (person.getEmail() == null || person.getEmail().trim().isEmpty()) {
            return "Email is required";
        }
        if (!isValidEmail(person.getEmail())) {
            return "Invalid email format";
        }
        return null;
    }

    /**
     * Validate person data for update
     */
    private String validatePersonForUpdate(Person person) {
        return validatePersonForCreate(person);
    }

    /**
     * Validate email format
     */
    private boolean isValidEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        String emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";
        return email.matches(emailRegex);
    }

    /**
     * Validate date format (yyyy-MM-dd)
     */
    private boolean isValidDate(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return false;
        }
        try {
            DATE_FORMAT.setLenient(false);
            DATE_FORMAT.parse(dateStr);
            return true;
        } catch (ParseException e) {
            return false;
        }
    }

    /**
     * Extract String from Object (handles null safely)
     */
    private String getString(Object value) {
        return value == null ? null : value.toString().trim();
    }

    /**
     * Extract Integer from Object
     */
    private Integer getInteger(Object value) {
        if (value == null) return null;
        if (value instanceof Integer) return (Integer) value;
        if (value instanceof Number) return ((Number) value).intValue();
        return Integer.parseInt(value.toString());
    }

    /**
     * Build error response with BAD_REQUEST status
     */
    private Response buildErrorResponse(String message) {
        return Response.status(Response.Status.BAD_REQUEST)
                .entity(createErrorMap(message))
                .build();
    }

    /**
     * Create error map
     */
    private Map<String, String> createErrorMap(String message) {
        Map<String, String> error = new HashMap<>();
        error.put("error", message);
        return error;
    }
}