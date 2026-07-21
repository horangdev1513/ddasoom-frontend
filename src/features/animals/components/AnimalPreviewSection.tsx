import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PawPrint, Search, Heart } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { MoreButton } from "@/shared/components/common/MoreButton";
import { useAuthStore } from "@/shared/stores/authStore";
import { useAnimalLikeMutation } from "@/features/animals/hooks/useAnimalLikeMutation";
import type { AnimalPreview } from "@/features/animals/types";
import dogIcon from "@/assets/dog.png";
import catIcon from "@/assets/cat.png";

// 메인 페이지 "유기동물 미리보기" 섹션 — 검색바(유기동물 목록으로 진입) + 카드 그리드.
// 데이터는 props로만 받는다(목업/실데이터 무관). 검색은 필터를 쿼리로 실어 /animals 로 이동만 한다.
// ⚠️ 시/도·군/구 목록은 피그마 데모 데이터 — 실제 지역 필터 스펙(공공API 지역코드)은 유기동물 담당자와 협의 후 교체.
const SIDO_LIST = [
  "시/도 전체",
  "서울",
  "경기",
  "부산",
  "인천",
  "대구",
  "광주",
  "대전",
  "울산",
  "세종",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
];

const SIGUNGU_MAP: Record<string, string[]> = {
  서울: [
    "군/구 전체",
    "강남구",
    "강동구",
    "강북구",
    "강서구",
    "관악구",
    "광진구",
    "구로구",
    "금천구",
    "노원구",
    "도봉구",
    "동대문구",
    "동작구",
    "마포구",
    "서대문구",
    "서초구",
    "성동구",
    "성북구",
    "송파구",
    "양천구",
    "영등포구",
    "용산구",
    "은평구",
    "종로구",
    "중구",
    "중랑구",
  ],
  경기: [
    "군/구 전체",
    "가평군",
    "고양시",
    "과천시",
    "광명시",
    "광주시",
    "구리시",
    "군포시",
    "김포시",
    "남양주시",
    "동두천시",
    "부천시",
    "성남시",
    "수원시",
    "시흥시",
    "안산시",
    "안성시",
    "안양시",
    "양주시",
    "양평군",
    "여주시",
    "연천군",
    "오산시",
    "용인시",
    "의왕시",
    "의정부시",
    "이천시",
    "파주시",
    "평택시",
    "포천시",
    "하남시",
    "화성시",
  ],
  부산: [
    "군/구 전체",
    "강서구",
    "금정구",
    "기장군",
    "남구",
    "동구",
    "동래구",
    "부산진구",
    "북구",
    "사상구",
    "사하구",
    "서구",
    "수영구",
    "연제구",
    "영도구",
    "중구",
    "해운대구",
  ],
  인천: [
    "군/구 전체",
    "강화군",
    "계양구",
    "남동구",
    "동구",
    "미추홀구",
    "부평구",
    "서구",
    "연수구",
    "옹진군",
    "중구",
  ],
  대구: [
    "군/구 전체",
    "군위군",
    "남구",
    "달서구",
    "달성군",
    "동구",
    "북구",
    "서구",
    "수성구",
    "중구",
  ],
  광주: ["군/구 전체", "광산구", "남구", "동구", "북구", "서구"],
  대전: ["군/구 전체", "대덕구", "동구", "서구", "유성구", "중구"],
  울산: ["군/구 전체", "남구", "동구", "북구", "울주군", "중구"],
  세종: ["군/구 전체"], // 세종특별자치시 — 하위 군/구 없음
  강원: [
    "군/구 전체",
    "강릉시",
    "고성군",
    "동해시",
    "삼척시",
    "속초시",
    "양구군",
    "양양군",
    "영월군",
    "원주시",
    "인제군",
    "정선군",
    "철원군",
    "춘천시",
    "태백시",
    "평창군",
    "홍천군",
    "화천군",
    "횡성군",
  ],
  충북: [
    "군/구 전체",
    "괴산군",
    "단양군",
    "보은군",
    "영동군",
    "옥천군",
    "음성군",
    "제천시",
    "증평군",
    "진천군",
    "청주시",
    "충주시",
  ],
  충남: [
    "군/구 전체",
    "계룡시",
    "공주시",
    "금산군",
    "논산시",
    "당진시",
    "보령시",
    "부여군",
    "서산시",
    "서천군",
    "아산시",
    "예산군",
    "천안시",
    "청양군",
    "태안군",
    "홍성군",
  ],
  전북: [
    "군/구 전체",
    "고창군",
    "군산시",
    "김제시",
    "남원시",
    "무주군",
    "부안군",
    "순창군",
    "완주군",
    "익산시",
    "임실군",
    "장수군",
    "전주시",
    "정읍시",
    "진안군",
  ],
  전남: [
    "군/구 전체",
    "강진군",
    "고흥군",
    "곡성군",
    "광양시",
    "구례군",
    "나주시",
    "담양군",
    "목포시",
    "무안군",
    "보성군",
    "순천시",
    "신안군",
    "여수시",
    "영광군",
    "영암군",
    "완도군",
    "장성군",
    "장흥군",
    "진도군",
    "함평군",
    "해남군",
    "화순군",
  ],
  경북: [
    "군/구 전체",
    "경산시",
    "경주시",
    "고령군",
    "구미시",
    "김천시",
    "문경시",
    "봉화군",
    "상주시",
    "성주군",
    "안동시",
    "영덕군",
    "영양군",
    "영주시",
    "영천시",
    "예천군",
    "울릉군",
    "울진군",
    "의성군",
    "청도군",
    "청송군",
    "칠곡군",
    "포항시",
  ],
  경남: [
    "군/구 전체",
    "거제시",
    "거창군",
    "고성군",
    "김해시",
    "남해군",
    "밀양시",
    "사천시",
    "산청군",
    "양산시",
    "의령군",
    "진주시",
    "창녕군",
    "창원시",
    "통영시",
    "하동군",
    "함안군",
    "함양군",
    "합천군",
  ],
  제주: ["군/구 전체", "서귀포시", "제주시"],
};

// kind/gender 코드 → 표시 문자열 (DB는 원본 코드 저장, 변환은 프론트 책임)
const KIND_LABEL: Record<AnimalPreview["kind"], string> = {
  D: "강아지",
  C: "고양이",
};

// 보호 상태 표시 — is_fostered 파생 + 피그마 statusColor 매핑.
// ⚠️ 피그마의 세 번째 상태("보호중" #C4B4A4)는 현재 스키마(boolean)로 파생 불가 — 상태 세분화는 담당자 협의 대상.
const STATUS_STYLE = {
  available: { label: "임시보호가능", color: "#F4B942" },
  fostered: { label: "임시보호중", color: "#9C8B75" },
} as const;

// 이미지 NULL(공공API 미제공) 대비 placeholder
const FALLBACK_IMAGE = import.meta.env.VITE_IMAGE_PLACEHOLDER;

export function AnimalPreviewSection({
  animals,
}: {
  animals: AnimalPreview[];
}) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const {
    mutate: toggleLike,
    isPending: likePending,
    variables,
  } = useAnimalLikeMutation();
  const [species, setSpecies] = useState<"전체" | "강아지" | "고양이">("전체");
  const [sido, setSido] = useState<string>("");
  const [sigungu, setSigungu] = useState<string>("");

  // 비로그인 클릭 → 로그인 유도. 로그인 → 낙관적 토글(list/detail 페이지와 동일 패턴).
  const handleLikeToggle = (e: React.MouseEvent, animal: AnimalPreview) => {
    e.stopPropagation(); // 카드 클릭(상세 이동)과 분리
    if (!user) {
      toast("로그인 후 좋아요할 수 있어요.");
      navigate("/login");
      return;
    }
    if (likePending && variables?.animalId === animal.animalId) return; // 중복 클릭 방지
    toggleLike({ animalId: animal.animalId, currentlyLiked: animal.isLiked });
  };

  // 시/도 선택에 따라 군/구 목록 연동 — 시/도 변경 시 군/구는 리셋 (피그마 원본 동작)
  const sigunguList =
    sido && sido !== "시/도 전체" && SIGUNGU_MAP[sido]
      ? SIGUNGU_MAP[sido]
      : ["군/구 전체"];

  const handleSidoChange = (value: string) => {
    setSido(value);
    setSigungu("");
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (species !== "전체") params.set("species", species);
    if (sido && sido !== "시/도 전체") params.set("sido", sido);
    if (sigungu && sigungu !== "군/구 전체") params.set("sigungu", sigungu);
    navigate(`/animals?${params.toString()}`); // 필터 파라미터 스펙은 목록 페이지(담당자)와 협의
  };

  return (
    <section className="bg-secondary py-14">
      <div className="mx-auto max-w-6xl px-6">
        {/* ── 검색바: [강아지|고양이 토글] | [시/도] [군/구] [검색] ── */}
        <div className="mb-8 flex items-stretch gap-3 rounded-2xl border border-border bg-white p-4">
          {(
            [
              { type: "강아지", icon: dogIcon },
              { type: "고양이", icon: catIcon },
            ] as const
          ).map(({ type, icon }) => {
            const active = species === type;
            return (
              <button
                key={type}
                onClick={() => setSpecies(active ? "전체" : type)}
                className={`flex w-[90px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border-[1.5px] py-2 transition-all ${
                  active
                    ? "border-ring bg-secondary text-ring"
                    : "border-border bg-muted text-muted-foreground hover:border-ring/60 hover:bg-secondary/50 hover:text-ring"
                }`}
              >
                {/* [3] 아이콘 → 이미지 — 피그마 원형: w-9 h-9 object-contain */}
                <img src={icon} alt={type} className="h-9 w-9 object-contain" />
                <span className="text-sm font-semibold">{type}</span>
              </button>
            );
          })}

          <div className="w-px bg-border" />

          {/* 시/도 — 크림 박스(bg-secondary), !h-full로 shadcn 내장 h-9를 무효화해 토글과 같은 높이로 stretch */}
          <div className="flex flex-[2]">
            <Select value={sido} onValueChange={handleSidoChange}>
              <SelectTrigger className="!h-full w-full rounded-xl border-border bg-secondary px-4 text-base data-[placeholder]:text-muted-foreground">
                <SelectValue placeholder="시 / 도" />
              </SelectTrigger>
              <SelectContent className="max-h-52">
                {SIDO_LIST.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 군/구 — 시/도 연동 (동일 스타일) */}
          <div className="flex flex-[2]">
            <Select value={sigungu} onValueChange={setSigungu}>
              <SelectTrigger className="!h-full w-full rounded-xl border-border bg-secondary px-4 text-base data-[placeholder]:text-muted-foreground">
                <SelectValue placeholder="군 / 구" />
              </SelectTrigger>
              <SelectContent className="max-h-52">
                {sigunguList.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 검색 버튼 — 피그마 원형: 높이 미지정 순수 button이라 자연 stretch */}
          <button
            onClick={handleSearch}
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-ring px-6 text-base font-bold text-white transition-all hover:brightness-105"
          >
            <Search size={16} />
            검색
          </button>
        </div>

        {/* ── 섹션 헤더 ── */}
        <div className="mb-6">
          <div className="mb-1 flex items-center gap-2">
            <PawPrint size={30} className="text-primary" />
            <h2 className="text-3xl font-bold text-foreground">
              우리 아이들을 소개합니다
            </h2>
          </div>
          <p className="text-base text-muted-foreground">
            새 가족을 기다리는 아이들이에요. 따뜻한 손을 내밀어 주세요.
          </p>
        </div>

        {/* ── 카드 그리드 — 피그마 원형: 사진 200px + 이름/품종 pill + 정보 4줄 + 자세히 보기 ── */}
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {animals.map((animal) => {
            const status = animal.isFostered
              ? STATUS_STYLE.fostered
              : STATUS_STYLE.available;
            return (
              <div
                key={animal.animalId}
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
                  <button
                    onClick={(e) => handleLikeToggle(e, animal)}
                    disabled={
                      likePending && variables?.animalId === animal.animalId
                    }
                    aria-label={animal.isLiked ? "좋아요 취소" : "좋아요"}
                    aria-pressed={animal.isLiked}
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 transition-all hover:scale-110 hover:bg-white disabled:opacity-60"
                  >
                    <Heart
                      size={15}
                      className={
                        animal.isLiked
                          ? "text-[#F87171]"
                          : "text-muted-foreground"
                      }
                      fill={animal.isLiked ? "#F87171" : "none"}
                    />
                  </button>
                </div>

                {/* 본문 — 이름 + 품종 pill, 정보 4줄, 자세히 보기 */}
                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-base font-bold text-foreground">
                      {animal.nickname}
                    </span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {KIND_LABEL[animal.kind]}
                    </span>
                  </div>
                  <div className="mb-4 space-y-1.5">
                    <InfoRow label="성별">
                      {/* 성별 색 — 피그마 원형: 수컷 파랑 / 암컷 핑크 / 미상 회갈 */}
                      <span
                        style={{
                          color:
                            animal.gender === "M"
                              ? "#6B9FD4"
                              : animal.gender === "F"
                                ? "#E88FA0"
                                : "#9C8B75",
                        }}
                      >
                        {animal.gender === "M"
                          ? "♂ 수컷"
                          : animal.gender === "F"
                            ? "♀ 암컷"
                            : "미상"}
                      </span>
                    </InfoRow>
                    {/* age는 공공API 원본 문자열 그대로 표기 (파싱/가공 금지 — DB 컨벤션과 동일 원칙) */}
                    <InfoRow label="나이">
                      <span className="text-[#7A6A58]">{animal.age}</span>
                    </InfoRow>
                    <InfoRow label="발견지역">
                      <span className="truncate text-[#7A6A58]">
                        {animal.location}
                      </span>
                    </InfoRow>
                    <InfoRow label="보호상태">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={{
                          background: `${status.color}22`,
                          color: status.color,
                        }}
                      >
                        {status.label}
                      </span>
                    </InfoRow>
                  </div>
                  <button className="w-full rounded-xl border border-ring/30 bg-secondary py-2.5 text-sm font-semibold text-ring transition-colors group-hover:border-ring group-hover:bg-ring group-hover:text-white">
                    자세히 보기
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 더보기 — 피그마 원형: pill 버튼 (다른 섹션의 MoreButton과 동일 스타일, 패딩만 큼) */}
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => navigate("/animals")}
            className="rounded-full border border-border px-10 py-3 text-base font-semibold text-muted-foreground transition-colors hover:border-ring hover:text-ring"
          >
            더 많은 아이들 보기 →
          </button>
        </div>
      </div>
    </section>
  );
}

/** 카드 정보 행 — 피그마 InfoRow 원형 (라벨 좌 / 값 우) */
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
