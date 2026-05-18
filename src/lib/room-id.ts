import { nanoid } from 'nanoid'

const ROOM_ID_LENGTH = 10
const VALID_ROOM_ID_PATTERN = /^[a-zA-Z0-9_-]{10}$/

export function generateRoomId(): string {
  return nanoid(ROOM_ID_LENGTH)
}

export function validateRoomId(roomId: string): boolean {
  return VALID_ROOM_ID_PATTERN.test(roomId)
}
