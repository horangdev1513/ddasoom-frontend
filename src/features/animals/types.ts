// features/animals 도메인 전용 타입 정의 파일

/**
 * 메인 페이지 유기동물 미리보기 카드 1건.
 * ⚠️ [담당자 계약] animal 테이블 실스키마(V101 시드) 기준으로 작성 —
 *    미리보기 API(최신 4건) 응답 DTO를 이 형태로 맞춰주시거나, 다르면 이 타입과
 *    MainPage 목업을 실스펙으로 함께 수정해 주세요. (담당: 유기동물 도메인)
 */
export interface AnimalPreview {
  animalId: number;
  abandonmentId: string;       // 유기번호 — 공공API 원본 (예: "413587202600162")
  kind: 'D' | 'C';             // D=강아지, C=고양이 (표시 변환은 프론트)
  nickname: string;            // 미지정 시 DB DEFAULT '미정'
  gender: 'M' | 'F' | 'Q';     // 수/암/미상 (표시 변환은 프론트)
  typeName: string;            // 품종
  age: string;                 // ⚠️ 공공API 원본 문자열 그대로 (예: "2024", "2026(년생) 추정 2개월")
  location: string;            // 보호 장소
  likeCount: number;
  isFostered: boolean;         // 임시보호 중 여부 — 카드 상태 뱃지의 파생 근거
  isLiked: boolean;
  imageUrl: string | null;     // ⚠️ NULL 가능 — 카드에서 placeholder 처리 필수
}

// ── 여기부터 유기동물 담당(새싹3) 실API 계약 ────────────────────────────

/** 종/성별 코드 (DB 원본 코드 — 표시 변환은 프론트 책임) */
export type AnimalKindCode = 'D' | 'C';       // D=강아지, C=고양이
export type AnimalGenderCode = 'M' | 'F' | 'Q'; // 수/암/미상

/**
 * 목록/마이페이지 카드 1건.
 * 백엔드: animal/dto/response/AnimalListPageResponse.java 와 1:1.
 * (마이페이지 AnimalMyPageResponse는 isLiked 필드가 없지만, 정의상 전부 좋아요한 동물이므로
 *  프론트에서 isLiked=true로 채워 이 타입으로 통일해 카드 재사용.)
 */
export interface AnimalListItem {
  animalId: number;
  kind: AnimalKindCode;
  nickname: string;
  gender: AnimalGenderCode;
  typeName: string;
  age: string;                 // 공공API 원본 문자열 그대로
  location: string;
  imageUrl: string | null;     // NULL 가능 — placeholder 처리 필수
  isFostered: boolean;
  likeCount: number;
  isLiked: boolean;            // 로그인 회원이 좋아요한 동물인지(비로그인이면 false)
}

/**
 * 상세 페이지.
 * 백엔드: animal/dto/response/AnimalDetailPageResponse.java 와 1:1.
 */
export interface AnimalDetail {
  animalId: number;
  kind: AnimalKindCode;
  nickname: string;
  gender: AnimalGenderCode;
  typeName: string;
  age: string;
  location: string;
  weight: string;              // 공공API 원본 문자열
  color: string;
  specialMark: string;
  vaccinationChk: string;
  imageUrl: string | null;
  isFostered: boolean;
  likeCount: number;
  isLiked: boolean;
}

/**
 * 목록 동적 검색 필터.
 * 백엔드: GET /api/animals/list 의 쿼리 파라미터(kind/location/isFostered/isLiked/gender)와 대응.
 * 미지정(undefined) = 필터 미적용. queryKey 안정성을 위해 값이 있는 것만 채운다.
 */
export interface AnimalFilters {
  kind?: AnimalKindCode;
  gender?: AnimalGenderCode;
  location?: string;
  isFostered?: boolean;
  isLiked?: boolean;
}
