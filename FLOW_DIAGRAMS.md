# Staff Priority Upload System - Flow Diagrams

## 1. Upload Flow by User Role

```
┌─────────────────────────────────────────────────────────────────────┐
│                        File Upload Request                          │
│                     POST /api/print-jobs                            │
└─────────────────┬───────────────────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │  Authentication    │
         │  (requireAuth)     │
         └────────┬───────────┘
                  │
                  ▼
         ┌────────────────────┐
         │  Check User Role   │
         └────────┬───────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
    ▼             ▼             ▼
┌───────┐    ┌────────┐    ┌─────────┐
│ Admin │    │ Staff  │    │ Student │
│ role  │    │ role   │    │  role   │
└───┬───┘    └───┬────┘    └────┬────┘
    │            │              │
    │            │              │
    ▼            ▼              ▼
┌───────────┐ ┌──────────┐ ┌──────────┐
│ Return    │ │ Set      │ │ Set      │
│ 403       │ │ priority │ │ priority │
│ Forbidden │ │ = 'high' │ │ = 'normal'│
└───────────┘ └────┬─────┘ └────┬─────┘
                   │            │
                   │            │
                   ▼            ▼
              ┌─────────────────────┐
              │  Create Print Job   │
              │  with priority      │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │  QueueManager       │
              │  .enqueue(jobId)    │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │  Position in Queue  │
              │  based on priority  │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   Return Success    │
              │   with job details  │
              └─────────────────────┘
```

## 2. Queue Priority Insertion Logic

```
SCENARIO: Staff uploads while queue has normal priority jobs

Initial Queue:
┌──────────────────────────────────────┐
│ Position 1: Student Job A (normal)   │
│ Position 2: Student Job B (normal)   │
│ Position 3: Student Job C (normal)   │
└──────────────────────────────────────┘

Staff uploads new job → priority: 'high'

QueueManager.enqueue() Process:
    │
    ├─► Check if job is high priority
    │   └─► YES
    │
    ├─► Find last high priority job position
    │   └─► None found
    │
    ├─► Insert at position 1
    │
    └─► Shift all jobs down by 1 position

Updated Queue:
┌──────────────────────────────────────┐
│ Position 1: Staff Job D (high)   ←── NEW (inserted)
│ Position 2: Student Job A (normal) ←─ shifted from pos 1
│ Position 3: Student Job B (normal) ←─ shifted from pos 2
│ Position 4: Student Job C (normal) ←─ shifted from pos 3
└──────────────────────────────────────┘

---

SCENARIO: Another staff uploads (queue has high priority jobs)

Current Queue:
┌──────────────────────────────────────┐
│ Position 1: Staff Job D (high)       │
│ Position 2: Student Job A (normal)   │
│ Position 3: Student Job B (normal)   │
└──────────────────────────────────────┘

Staff uploads new job → priority: 'high'

QueueManager.enqueue() Process:
    │
    ├─► Check if job is high priority
    │   └─► YES
    │
    ├─► Find last high priority job position
    │   └─► Position 1 (Staff Job D)
    │
    ├─► Insert at position 2 (after last high priority)
    │
    └─► Shift jobs at/after position 2 down by 1

Updated Queue:
┌──────────────────────────────────────┐
│ Position 1: Staff Job D (high)       │
│ Position 2: Staff Job E (high)   ←── NEW (inserted)
│ Position 3: Student Job A (normal) ←─ shifted from pos 2
│ Position 4: Student Job B (normal) ←─ shifted from pos 3
└──────────────────────────────────────┘
```

## 3. Database Query Flow

```
Client Request: GET /api/print-jobs

┌─────────────────────────────────────┐
│  Receive Request                    │
│  with auth token                    │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  requireAuth middleware             │
│  - Verify token                     │
│  - Load user from Clerk             │
│  - Attach to req.user               │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  Build MongoDB query filter         │
│  - status (if provided)             │
│  - printerId (if provided)          │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  Execute query with priority sort   │
│  PrintJob.find(filter)              │
│    .sort({ priority: -1,            │
│             createdAt: 1 })         │
│    .populate('printerId')           │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  MongoDB Index Used:                │
│  { priority: -1, createdAt: 1 }     │
│  ✓ Fast query execution             │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  Results sorted by:                 │
│  1. Priority (high first)           │
│  2. CreatedAt (oldest first)        │
└───────────────┬─────────────────────┘
                │
                ▼
┌─────────────────────────────────────┐
│  Return paginated response          │
│  {                                  │
│    jobs: [...],                     │
│    pagination: {...}                │
│  }                                  │
└─────────────────────────────────────┘
```

## 4. Role-Based Access Control

```
┌────────────────────────────────────────────────────────┐
│                    API Endpoints                       │
└────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ POST         │  │ GET          │  │ POST         │
│ /print-jobs  │  │ /print-jobs  │  │ /admin/      │
│              │  │              │  │ create-user  │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       │                 │                 │
┌──────▼───────────────────────────────────▼──────┐
│         Authentication Middleware                │
│         (requireAuth)                            │
│                                                  │
│  ✓ Verify Clerk JWT token                       │
│  ✓ Load user from Clerk API                     │
│  ✓ Attach user data to req.user                 │
│  ✓ Populate role from publicMetadata            │
└──────┬──────────────────────────────────┬───────┘
       │                                  │
       │                                  │
┌──────▼───────┐                   ┌──────▼───────┐
│ Role Check   │                   │ requireAdmin │
│              │                   │              │
│ if (admin)   │                   │ if (!admin)  │
│   → 403      │                   │   → 403      │
│              │                   │              │
│ if (staff)   │                   │ if (admin)   │
│   → high     │                   │   → proceed  │
│              │                   │              │
│ if (student) │                   └──────────────┘
│   → normal   │
│              │
└──────────────┘

Role Capabilities Matrix:
┌─────────┬──────────┬──────────┬─────────────┐
│  Role   │  Upload  │  Create  │  View All   │
│         │  Files   │  Users   │  Jobs       │
├─────────┼──────────┼──────────┼─────────────┤
│ Admin   │    ❌    │    ✅    │     ✅      │
│ Staff   │    ✅    │    ❌    │     ❌      │
│         │  (high)  │          │             │
│ Student │    ✅    │    ❌    │     ❌      │
│         │ (normal) │          │  (own only) │
└─────────┴──────────┴──────────┴─────────────┘
```

## 5. Error Handling Flow

```
Upload Request
      │
      ▼
┌──────────────┐
│ Auth Check   │
└──────┬───────┘
       │
   ┌───┴───┐
   │ Valid?│
   └───┬───┘
       │
    No │ Yes
       │   │
       ▼   ▼
    ┌─────────────┐    ┌──────────────┐
    │ 401         │    │ Role Check   │
    │ Unauthorized│    └──────┬───────┘
    └─────────────┘           │
                          ┌───┴───┐
                          │ Admin?│
                          └───┬───┘
                              │
                           Yes│ No (staff/student)
                              │   │
                              ▼   ▼
                         ┌──────────┐    ┌──────────────┐
                         │ 403      │    │ Validate     │
                         │ ADMIN_   │    │ Request      │
                         │ UPLOAD_  │    └──────┬───────┘
                         │ FORBIDDEN│           │
                         └──────────┘       ┌───┴───┐
                                           │ Valid?│
                                           └───┬───┘
                                               │
                                            No │ Yes
                                               │   │
                                               ▼   ▼
                                          ┌─────────┐  ┌─────────┐
                                          │ 400     │  │ Create  │
                                          │ Bad     │  │ Job     │
                                          │ Request │  └────┬────┘
                                          └─────────┘       │
                                                            ▼
                                                       ┌─────────┐
                                                       │ 201     │
                                                       │ Created │
                                                       └─────────┘

Error Response Format:
{
  "success": false,
  "error": {
    "message": "Description of error",
    "code": "ERROR_CODE"
  }
}

Error Codes:
- AUTH_REQUIRED (401)
- ADMIN_UPLOAD_FORBIDDEN (403)
- STAFF_REQUIRED (403)
- PRINTER_NOT_FOUND (404)
- PRINTER_UNAVAILABLE (400)
```

## 6. Complete System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  - Upload Component (same for all users)                        │
│  - No role-specific UI changes                                  │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       │ HTTP POST /api/print-jobs
                       │ Authorization: Bearer <token>
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Express.js Backend                          │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Middleware Layer                                           │ │
│  │  - requireAuth (Clerk JWT verification)                    │ │
│  │  - Load user role from Clerk publicMetadata                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                       │                                          │
│                       ▼                                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Route Handler: POST /api/print-jobs                        │ │
│  │  1. Check if admin → return 403                            │ │
│  │  2. Set priority based on role                             │ │
│  │  3. Create PrintJob document                               │ │
│  │  4. Call QueueManager.enqueue()                            │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                      MongoDB Database                            │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ PrintJob Collection                                        │ │
│  │  - priority: 'high' | 'normal'                             │ │
│  │  - status, file, settings, etc.                            │ │
│  │                                                             │ │
│  │  Index: { priority: -1, createdAt: 1 }                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Queue Collection                                           │ │
│  │  - printJobId (ref to PrintJob)                            │ │
│  │  - position: 1, 2, 3...                                    │ │
│  │  - status: 'pending' | 'in-progress'                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Queue Processing                              │
│                                                                   │
│  1. QueueManager.getNextJob()                                    │
│     → Sorted by queue position (which respects priority)         │
│                                                                   │
│  2. Process job                                                  │
│     → High priority jobs processed first                         │
│                                                                   │
│  3. QueueManager.completeJob()                                   │
│     → Remove from queue, update status                           │
└──────────────────────────────────────────────────────────────────┘
```

## Summary

The staff priority upload system implements a multi-layer architecture:

1. **Authentication Layer**: Clerk verifies user identity and provides role
2. **Authorization Layer**: Middleware enforces role-based access control
3. **Business Logic Layer**: Routes handle priority assignment and validation
4. **Queue Management Layer**: QueueManager handles priority-based positioning
5. **Data Layer**: MongoDB stores jobs with priority field and indexed queries

Key Features:
- ✅ Zero frontend changes required
- ✅ Server-side priority enforcement
- ✅ Efficient queue management with priority
- ✅ Role-based access control
- ✅ Admin user creation capability
- ✅ Complete error handling
