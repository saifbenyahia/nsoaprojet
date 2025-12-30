package com.person_back.dao;

import com.person_back.model.Person;
import javax.persistence.*;
import java.util.List;

public class PersonDAO {
    
    private EntityManagerFactory emf = Persistence.createEntityManagerFactory("personPU");

    /**
     * Find all persons ordered by creation date (newest first)
     */
    public List<Person> findAll() {
        EntityManager em = emf.createEntityManager();
        try {
            TypedQuery<Person> query = em.createQuery(
                "SELECT p FROM Person p ORDER BY p.id DESC", 
                Person.class
            );
            return query.getResultList();
        } finally {
            em.close();
        }
    }

    /**
     * Find person by ID
     */
    public Person findById(Long id) {
        EntityManager em = emf.createEntityManager();
        try {
            return em.find(Person.class, id);
        } finally {
            em.close();
        }
    }

    /**
     * Find persons by name (case-insensitive, searches name, nom, prenom)
     */
    public List<Person> findByName(String name) {
        EntityManager em = emf.createEntityManager();
        try {
            TypedQuery<Person> query = em.createQuery(
                "SELECT p FROM Person p WHERE " +
                "LOWER(p.name) LIKE LOWER(:name) OR " +
                "LOWER(p.nom) LIKE LOWER(:name) OR " +
                "LOWER(p.prenom) LIKE LOWER(:name)", 
                Person.class
            );
            query.setParameter("name", "%" + name + "%");
            return query.getResultList();
        } finally {
            em.close();
        }
    }

    /**
     * Check if email exists (for validation)
     */
    public boolean existsByEmail(String email) {
        EntityManager em = emf.createEntityManager();
        try {
            TypedQuery<Long> query = em.createQuery(
                "SELECT COUNT(p) FROM Person p WHERE LOWER(p.email) = LOWER(:email)", 
                Long.class
            );
            query.setParameter("email", email);
            Long count = query.getSingleResult();
            return count > 0;
        } finally {
            em.close();
        }
    }

    /**
     * Check if email exists for a different person (for update validation)
     */
    public boolean existsByEmailExcludingId(String email, Long excludeId) {
        EntityManager em = emf.createEntityManager();
        try {
            TypedQuery<Long> query = em.createQuery(
                "SELECT COUNT(p) FROM Person p WHERE LOWER(p.email) = LOWER(:email) AND p.id != :id", 
                Long.class
            );
            query.setParameter("email", email);
            query.setParameter("id", excludeId);
            Long count = query.getSingleResult();
            return count > 0;
        } finally {
            em.close();
        }
    }

    /**
     * Create new person
     */
    public void create(Person person) {
        EntityManager em = emf.createEntityManager();
        try {
            em.getTransaction().begin();
            em.persist(person);
            em.getTransaction().commit();
        } catch (Exception e) {
            if (em.getTransaction().isActive()) {
                em.getTransaction().rollback();
            }
            throw new RuntimeException("Error creating person: " + e.getMessage(), e);
        } finally {
            em.close();
        }
    }

    /**
     * Update existing person
     */
    public void update(Person person) {
        EntityManager em = emf.createEntityManager();
        try {
            em.getTransaction().begin();
            em.merge(person);
            em.getTransaction().commit();
        } catch (Exception e) {
            if (em.getTransaction().isActive()) {
                em.getTransaction().rollback();
            }
            throw new RuntimeException("Error updating person: " + e.getMessage(), e);
        } finally {
            em.close();
        }
    }

    /**
     * Delete person by ID
     */
    public void delete(Long id) {
        EntityManager em = emf.createEntityManager();
        try {
            em.getTransaction().begin();
            Person person = em.find(Person.class, id);
            if (person != null) {
                em.remove(person);
            }
            em.getTransaction().commit();
        } catch (Exception e) {
            if (em.getTransaction().isActive()) {
                em.getTransaction().rollback();
            }
            throw new RuntimeException("Error deleting person: " + e.getMessage(), e);
        } finally {
            em.close();
        }
    }

    /**
     * Count total persons
     */
    public long count() {
        EntityManager em = emf.createEntityManager();
        try {
            TypedQuery<Long> query = em.createQuery(
                "SELECT COUNT(p) FROM Person p", 
                Long.class
            );
            return query.getSingleResult();
        } finally {
            em.close();
        }
    }

    /**
     * Count persons by department
     */
    public long countByDepartement(String departement) {
        EntityManager em = emf.createEntityManager();
        try {
            TypedQuery<Long> query = em.createQuery(
                "SELECT COUNT(p) FROM Person p WHERE p.departement = :dept", 
                Long.class
            );
            query.setParameter("dept", departement);
            return query.getSingleResult();
        } finally {
            em.close();
        }
    }

    /**
     * Get all unique departments
     */
    public List<String> getAllDepartements() {
        EntityManager em = emf.createEntityManager();
        try {
            TypedQuery<String> query = em.createQuery(
                "SELECT DISTINCT p.departement FROM Person p WHERE p.departement IS NOT NULL ORDER BY p.departement", 
                String.class
            );
            return query.getResultList();
        } finally {
            em.close();
        }
    }

    /**
     * Get all unique postes
     */
    public List<String> getAllPostes() {
        EntityManager em = emf.createEntityManager();
        try {
            TypedQuery<String> query = em.createQuery(
                "SELECT DISTINCT p.poste FROM Person p WHERE p.poste IS NOT NULL ORDER BY p.poste", 
                String.class
            );
            return query.getResultList();
        } finally {
            em.close();
        }
    }

    /**
     * Find persons with pagination
     */
    public List<Person> findWithPagination(int page, int pageSize) {
        EntityManager em = emf.createEntityManager();
        try {
            TypedQuery<Person> query = em.createQuery(
                "SELECT p FROM Person p ORDER BY p.id DESC", 
                Person.class
            );
            query.setFirstResult((page - 1) * pageSize);
            query.setMaxResults(pageSize);
            return query.getResultList();
        } finally {
            em.close();
        }
    }

    /**
     * Close EntityManagerFactory (call when shutting down application)
     */
    public void close() {
        if (emf != null && emf.isOpen()) {
            emf.close();
        }
    }
}
