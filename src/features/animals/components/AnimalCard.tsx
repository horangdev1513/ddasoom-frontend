import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import type { AnimalListItem } from "../types";

// 유기동물 카드 — 목록/마이페이지 공용(메인 AnimalPreviewSection 카드 디자인과 동일 재질).
// 데이터는 props로만 받는다. 카드 클릭 → 상세 이동, 하트 클릭 → onLikeToggle(카드 클릭과 분리).

const KIND_LABEL: Record<AnimalListItem["kind"], string> = {
  D: "강아지",
  C: "고양이",
};

// 보호 상태 표시 — is_fostered 파생 + 피그마 statusColor 매핑
const STATUS_STYLE = {
  available: { label: "임시보호가능", color: "#F4B942" },
  fostered: { label: "임시보호중", color: "#9C8B75" },
} as const;

// 성별 색 — 피그마 원형: 수컷 파랑 / 암컷 핑크 / 미상 회갈
const GENDER = {
  M: { label: "♂ 수컷", color: "#6B9FD4" },
  F: { label: "♀ 암컷", color: "#E88FA0" },
  Q: { label: "미상", color: "#9C8B75" },
} as const;

// 이미지 NULL(공공API 미제공) 대비 placeholder
const FALLBACK_IMAGE = import.meta.env.VITE_IMAGE_PLACEHOLDER;

interface AnimalCardProps {
  animal: AnimalListItem;
  onLikeToggle?: (animal: AnimalListItem) => void; // 하트 클릭 — 미지정 시 하트 비활성
  likePending?: boolean; // 토글 진행 중(중복 클릭 방지)
}

export function AnimalCard({
  animal,
  onLikeToggle,
  likePending,
}: AnimalCardProps) {
  const navigate = useNavigate();
  const status = animal.isFostered
    ? STATUS_STYLE.fostered
    : STATUS_STYLE.available;
  const gender = GENDER[animal.gender];

  const FALLBACK_IMAGE = import.meta.env.VITE_IMAGE_PLACEHOLDER;

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭(상세 이동)과 분리
    if (!likePending) onLikeToggle?.(animal);
  };

  return (
    <div
      onClick={() => navigate(`/animals/${animal.animalId}`)}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-white transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-[0_12px_32px_rgba(244,185,66,0.18)]"
    >
      {/* 사진 + 상태 뱃지 + 하트 */}
      <div className="relative h-[200px] overflow-hidden">
        <img
          src={animal.imageUrl ?? FALLBACK_IMAGE}
          alt={animal.nickname}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_IMAGE;
          }}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span
          className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold text-white"
          style={{ background: status.color }}
        >
          {status.label}
        </span>
        {onLikeToggle && (
          <button
            type="button"
            onClick={handleLikeClick}
            disabled={likePending}
            aria-label={animal.isLiked ? "좋아요 취소" : "좋아요"}
            aria-pressed={animal.isLiked}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 transition-all hover:scale-110 hover:bg-white disabled:opacity-60"
          >
            <Heart
              size={15}
              className={
                animal.isLiked ? "text-[#F87171]" : "text-muted-foreground"
              }
              fill={animal.isLiked ? "#F87171" : "none"}
            />
          </button>
        )}
      </div>

      {/* 본문 — 이름 + 품종 pill, 정보 3줄, 자세히 보기 */}
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="truncate text-base font-bold text-foreground">
            {animal.nickname}
          </span>
          <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {KIND_LABEL[animal.kind]}
          </span>
        </div>
        <div className="mb-4 space-y-1.5">
          <InfoRow label="성별">
            <span style={{ color: gender.color }}>{gender.label}</span>
          </InfoRow>
          {/* age는 공공API 원본 문자열 그대로 표기 (파싱/가공 금지) */}
          <InfoRow label="나이">
            <span className="text-[#7A6A58]">{animal.age}</span>
          </InfoRow>
          <InfoRow label="발견지역">
            <span className="truncate text-[#7A6A58]">{animal.location}</span>
          </InfoRow>
        </div>
        <button
          type="button"
          className="w-full rounded-xl border border-ring/30 bg-secondary py-2.5 text-sm font-semibold text-ring transition-colors group-hover:border-ring group-hover:bg-ring group-hover:text-white"
        >
          자세히 보기
        </button>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[#C4B4A4]">{label}</span>
      {children}
    </div>
  );
}
