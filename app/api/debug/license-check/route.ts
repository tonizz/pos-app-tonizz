import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function GET() {
  const secret = process.env.LICENSE_MASTER_SECRET ?? 'NOT_SET'
  const testKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXN0b21lck5hbWUiOiJUb25pYSAoRGV2ZWxvcGVyKSIsImN1c3RvbWVySWQiOiJPV05FUi0wMDEiLCJmZWF0dXJlcyI6WyJwb3MiLCJpbnZlbnRvcnkiLCJyZXBvcnRzIiwiYW5hbHl0aWNzIiwib3duZXJfZGFzaGJvYXJkIiwiYW5hbHl0aWNzX2hvdXJseSIsInB1cmNoYXNlX29yZGVycyIsImxveWFsdHkiLCJwcm9tb3Rpb25zIiwiY3JlZGl0cyIsImF0dGVuZGFuY2UiLCJqdXJuYWxfc3luYyIsIm11bHRpX3dhcmVob3VzZSIsImJhY2t1cCJdLCJleHBpcmVzQXQiOm51bGwsImlzc3VlZEF0IjoiMjAyNi0wNS0zMFQxMzoyODo1MS4wMTVaIiwibGljZW5zZVR5cGUiOiJsaWZldGltZSIsImlhdCI6MTc4MDE0NzczMX0.1B6jzpouVtx8O0hiBhPqg0ik5RSZWzwGvcVyYRNrgiY'

  let verifyResult = 'unknown'
  try {
    jwt.verify(testKey, secret)
    verifyResult = 'VALID'
  } catch (e: any) {
    verifyResult = 'FAILED: ' + e.message
  }

  return NextResponse.json({
    secretLength: secret.length,
    secretFirst10: secret.substring(0, 10),
    secretLast5: secret.slice(-5),
    verifyResult,
  })
}
