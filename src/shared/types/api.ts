// 백엔드 응답 공통 래퍼 타입 정의.
// 출처: common/dto/ApiResponse.java, common/exception/GlobalExceptionHandler.java
// 백엔드가 확정한 공통 응답 형식(code, message, data)을 그대로 반영한다.

/**
 * 모든 API의 공통 응답 래퍼.
 * 백엔드: common/dto/ApiResponse.java — code, message, data 3필드 (@AllArgsConstructor로 봉인, 정적 팩토리로만 생성).
 * - 성공 시: code === "SUCCESS" (ApiResponse.success(...) 계열)
 * - 실패 시: code === 에러 코드 문자열 (예: "MEMBER_001", "INVALID_INPUT"), data === null
 */
export interface ApiResponse<T> {
  // 백엔드: ApiResponse.java `private final String code;` — "SUCCESS" 또는 에러 코드
  code: string;
  // 백엔드: ApiResponse.java `private final String message;` — 사용자 노출용 메시지
  message: string;
  // 백엔드: ApiResponse.java `private final T data;` — 성공 페이로드. 데이터 없는 응답/실패 시 null
  data: T | null;
}

/**
 * 실패 응답 형태(= data가 항상 null인 ApiResponse).
 * 백엔드: common/exception/GlobalExceptionHandler.java 가 ApiResponse.error(code, message)로 내려보내는 형태.
 * - BusinessException  → ErrorCode.getCode() / getMessage() (예: AuthException, MemberException)
 * - @Valid 실패        → code "INVALID_INPUT", message = 첫 번째 필드 에러 메시지
 * - 미처리 예외        → code "GLOBAL_ERROR"
 * - 401/403           → Spring Security 필터(AuthenticationEntryPoint/AccessDeniedHandler)가 동일 포맷으로 반환
 */
export interface ApiError {
  code: string;
  message: string;
  data: null;
}
