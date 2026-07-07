// Access Token 재발급 single-flight 함수 자리.
//
// RT rotation(로테이션) 구조상 single-flight는 필수.
//   동시에 여러 요청이 401을 받아도 reissue 호출은 "단 하나"만 나가야 하며(진행 중이면 그 Promise를 공유),
//   중복 발사 시 두 번째 요청이 REFRESH_TOKEN_MISMATCH로 강제 로그아웃된다.
//
// TODO(백엔드 reissue API 확정 후 구현):
//   - POST /api/auth/reissue 를 조건 없이 호출(RT는 httpOnly라 프론트가 존재 여부 판단 불가).
//   - 진행 중 Promise를 모듈 스코프 변수로 보관해 동시 호출을 하나로 합친다(single-flight).
//   - 성공: 응답 바디의 새 AT(응답 필드명 미확정)를 authStore.setAccessToken 으로 갱신.
//   - 실패: authStore 초기화 후 일괄 로그아웃(코드별 분기 금지).
//   - reissue 자체의 401은 응답 인터셉터가 다시 잡지 않도록 예외 처리(무한 루프 방지).
//
// 미확정 백엔드 항목: AT 응답 필드명, expiresIn 단위.
// 백엔드 auth 컨트롤러에 reissue 엔드포인트가 아직 없어 실제 구현은 보류한다.

export {};
