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

/**
 * 페이징 공통 응답 래퍼.
 * 백엔드: common/dto/PageResponse.java — 전 도메인 목록 API가 이 규격으로 응답한다.
 * 사용: ApiResponse<PageResponse<T>> 형태로 중첩된다. (노션 [페이징 공통 규격 가이드] 참고)
 */
export interface PageResponse<T> {
  // 실제 목록 (응답 DTO 배열)
  content: T[];
  // 현재 페이지 — ⚠️ 0부터 시작(Spring 표준). UI 표시는 page + 1
  page: number;
  // 요청한 페이지 크기
  size: number;
  // 전체 건수
  totalElements: number;
  // 전체 페이지 수
  totalPages: number;
  // 다음 페이지 존재 여부 — 무한스크롤/마지막 페이지 판정은 이 필드 하나로
  hasNext: boolean;
  // 이전 페이지 존재 여부
  hasPrevious: boolean;
}
