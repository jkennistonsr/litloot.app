# Security Specification - LitLoot

## Data Invariants
1. A User profile can only be created/updated by the owner.
2. Cart items, Notifications, and Wishlist items are private to the user under their `/users/{userId}/...` path.
3. Users cannot modify terminal state or system fields without proper authentication and ownership.
4. Document IDs must be valid strings (length <= 128, matches pattern).
5. All writes must be validated against the schema defined in `firebase-blueprint.json`.

## The "Dirty Dozen" Payloads (Deny Cases)
1. **Identity Spoofing**: Attempt to create a user profile for a different UID.
   `{ "uid": "attacker_id", "theme": "dark" }` at `/users/victim_id`
2. **Shadow Field Injection**: Attempt to inject an unvalidated field into a CartItem.
   `{ "id": "p1", "name": "Loot", "price": 100, "quantity": 1, "isVerified": true }`
3. **Invalid Type Injection**: Attempt to set price as a string.
   `{ "id": "p1", "name": "Loot", "price": "100", "quantity": 1 }`
4. **Massive ID Attack**: Attempt to use a 1MB string as a document ID.
   `PATH: /users/USER_ID/cart/VERY_LONG_STRING...`
5. **PII Leak Attempt**: Unauthorized 'get' on another user's private document.
   `GET /users/victim_id` from `attacker_auth`
6. **Negative Quantity**: Attempt to add a CartItem with negative quantity.
   `{ "id": "p1", "name": "Loot", "price": 100, "quantity": -5 }`
7. **Bypassing Server Timestamp**: Providing a hardcoded client timestamp for `updatedAt`.
   `{ "theme": "dark", "updatedAt": "2020-01-01T00:00:00Z" }`
8. **Resource Exhaustion**: Sending a payload with a massive string in the `name` field.
   `{ "id": "p1", "name": "A".repeat(10000), "price": 100, "quantity": 1 }`
9. **Orphaned Cart Item**: Attempt to create a cart item without a corresponding product ID. (N/A if we don't strictly check product existence, but we should validate field presence).
10. **State Skipping**: Attempt to set a `Notification` as `read: false` when it's already `read: true` (if we had specific state transitions).
11. **Admin Privilege Escalation**: Attempt to create a document in a restricted path.
    `CREATE /system/configs/new_config`
12. **Unverified Email Access**: Attempting writes with `email_verified == false`.

## The Test Runner
I will create `firestore.rules.test.ts` to verify these. (Note: I can't actually run a full test suite with a real emulator here easily, but I will provide the skeleton and use ESLint to verify the rules).
