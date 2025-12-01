# API Documentation

## Endpoints

### `POST /api/autofill`

Executes the auto-fill algorithm to assign paddlers to seats based on weight, skills, and target trim.

**Request Body:**

```json
{
  "activePaddlerPool": [
    {
      "id": "string",
      "name": "string",
      "weight": number,
      "skills": ["left", "right", "drum", "steer"],
      "side": "left" | "right" | "both"
    }
  ],
  "assignments": {
    "seatId": "paddlerId"
  },
  "lockedSeats": ["seatId"],
  "targetTrim": number
}
```

**Response:**

```json
{
  "assignments": {
    "seatId": "paddlerId"
  }
}
```

**Error Response:**

```json
{
  "error": "string"
}
```
