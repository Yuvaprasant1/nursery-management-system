package com.nursery.common.firestore;

import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.QueryDocumentSnapshot;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.Map;
import java.util.concurrent.ExecutionException;

public class FirestoreConverter {
    
    public static Date toDate(LocalDateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        return Date.from(dateTime.atZone(ZoneId.systemDefault()).toInstant());
    }
    
    public static LocalDateTime toLocalDateTime(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof LocalDateTime) {
            return (LocalDateTime) value;
        }
        if (value instanceof Date) {
            return ((Date) value).toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
        }
        if (value instanceof com.google.cloud.Timestamp) {
            return ((com.google.cloud.Timestamp) value).toDate().toInstant()
                    .atZone(ZoneId.systemDefault()).toLocalDateTime();
        }
        return null;
    }
    
    public static <T extends BaseDocument> T toDocument(QueryDocumentSnapshot snapshot, Class<T> documentClass) {
        return toDocument((DocumentSnapshot) snapshot, documentClass);
    }
    
    public static <T extends BaseDocument> T toDocument(DocumentSnapshot snapshot, Class<T> documentClass) {
        try {
            T document = documentClass.getDeclaredConstructor().newInstance();
            Map<String, Object> data = snapshot.getData();
            
            if (data == null) {
                return document;
            }
            
            document.setId(snapshot.getId());
            
            // Convert all fields from Firestore data
            data.forEach((key, value) -> {
                try {
                    java.lang.reflect.Field field = findField(documentClass, key);
                    if (field != null) {
                        field.setAccessible(true);
                        
                        // Handle special types
                        if (field.getType() == LocalDateTime.class) {
                            field.set(document, toLocalDateTime(value));
                        } else if (field.getType() == Long.class && value instanceof Number) {
                            field.set(document, ((Number) value).longValue());
                        } else if (field.getType() == Integer.class && value instanceof Number) {
                            field.set(document, ((Number) value).intValue());
                        } else if (field.getType() == Boolean.class && value instanceof Boolean) {
                            field.set(document, value);
                        } else if (field.getType().isEnum() && value instanceof String) {
                            field.set(document, Enum.valueOf((Class<Enum>) field.getType(), (String) value));
                        } else {
                            field.set(document, value);
                        }
                    }
                } catch (Exception e) {
                    // Skip fields that can't be set
                }
            });
            
            return document;
        } catch (Exception e) {
            throw new RuntimeException("Failed to convert Firestore document to " + documentClass.getSimpleName(), e);
        }
    }
    
    public static Map<String, Object> toMap(BaseDocument document) {
        Map<String, Object> map = new java.util.HashMap<>();
        Class<?> clazz = document.getClass();
        
        while (clazz != null && clazz != Object.class) {
            for (java.lang.reflect.Field field : clazz.getDeclaredFields()) {
                field.setAccessible(true);
                try {
                    Object value = field.get(document);
                    if (value != null) {
                        String key = field.getName();
                        
                        // Handle special types
                        if (value instanceof LocalDateTime) {
                            map.put(key, com.google.cloud.Timestamp.of(toDate((LocalDateTime) value)));
                        } else if (value instanceof Enum) {
                            map.put(key, ((Enum<?>) value).name());
                        } else {
                            map.put(key, value);
                        }
                    }
                } catch (IllegalAccessException e) {
                    // Skip fields that can't be accessed
                }
            }
            clazz = clazz.getSuperclass();
        }
        
        return map;
    }
    
    private static java.lang.reflect.Field findField(Class<?> clazz, String fieldName) {
        while (clazz != null && clazz != Object.class) {
            try {
                return clazz.getDeclaredField(fieldName);
            } catch (NoSuchFieldException e) {
                clazz = clazz.getSuperclass();
            }
        }
        return null;
    }
}

