# New Letter Endpoints

## 1. GET Letter by ID

**Endpoint:** `GET /api/v1/letter/{letter_id}`

**Header:**
```
Authorization: Bearer <jwt_token>
```

**URL Example:**
```
GET http://localhost:5000/api/v1/letter/LET-20251028-12345
```

**Response (200 - Success):**
```json
{
  "status": "success",
  "letter": {
    "ID": "LET-20251028-12345",
    "Timestamp": "2025-10-28 10:30:45",
    "Created_by": "user@moe.gov.sa",
    "Letter_type": "خطاب جديد",
    "Recipient_name": "Minister Name",
    "Subject": "Letter Title",
    "Letter_content": "Full letter text..."
  }
}
```

**Error Responses:**
- `404` - Letter not found
- `403` - Not authorized (letter created by another user)
- `400` - Invalid letter ID format or missing sheet_id

---

## 2. DELETE Letter by ID

**Endpoint:** `DELETE /api/v1/letter/{letter_id}`

**Header:**
```
Authorization: Bearer <jwt_token>
```

**URL Example:**
```
DELETE http://localhost:5000/api/v1/letter/LET-20251028-12345
```

**Response (200 - Success):**
```json
{
  "status": "success",
  "message": "تم حذف الخطاب بنجاح",
  "letter_id": "LET-20251028-12345"
}
```

**Error Responses:**
- `404` - Letter not found
- `403` - Not authorized (only creator can delete)
- `400` - Invalid letter ID format or missing sheet_id

---

## JWT Token

The token must contain:

```json
{
  "sheet_id": "user-google-sheet-id",
  "user": {
    "email": "user@moe.gov.sa"
  }
}
```

---

## Example Requests

### cURL

```bash
# GET letter
curl -X GET "http://localhost:5000/api/v1/letter/LET-20251028-12345" \
  -H "Authorization: Bearer <jwt_token>"

# DELETE letter
curl -X DELETE "http://localhost:5000/api/v1/letter/LET-20251028-12345" \
  -H "Authorization: Bearer <jwt_token>"
```

### Frontend Usage (via Proxy)

**GET Letter:**
```javascript
// GET request
GET /api?endpoint=letter-by-id&letter_id=LET-20251028-12345
Headers: {
  Authorization: Bearer <jwt_token>
}
```

**DELETE Letter:**
```javascript
// DELETE request
DELETE /api?endpoint=delete-letter&letter_id=LET-20251028-12345
Headers: {
  Authorization: Bearer <jwt_token>
}
```

**Example JavaScript:**
```javascript
// Fetch letter
const response = await fetch(`/api?endpoint=letter-by-id&letter_id=${letterId}`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();

// Delete letter
const deleteResponse = await fetch(`/api?endpoint=delete-letter&letter_id=${letterId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const result = await deleteResponse.json();
```

---

## Notes

- Both endpoints require valid JWT token
- Only the letter creator can access and delete their own letters (ownership validated)
- Letter ID format: `LET-YYYYMMDD-XXXXX`
- All errors return status: "error"
