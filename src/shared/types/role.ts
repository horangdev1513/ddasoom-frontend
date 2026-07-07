// 백엔드: member/domain/Role.java — enum { GUEST, USER, ADMIN } 와 1:1 대응.
// ⚠️ 백엔드 Role.java enum이 바뀌면 이 파일도 반드시 함께 갱신해야 합니다.
export type Role = 'GUEST' | 'USER' | 'ADMIN';
