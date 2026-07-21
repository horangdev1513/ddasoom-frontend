import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  Loader2,
  MapPin,
  PawPrint,
  Syringe,
  HeartHandshake,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/shared/stores/authStore";
import { useAnimalDetailQuery } from "@/features/animals/hooks/useAnimalDetailQuery";
import { useAnimalLikeMutation } from "@/features/animals/hooks/useAnimalLikeMutation";
import { useMyPendingFosterApplication } from "@/features/foster/hooks/useMyPendingFosterApplication";
import type { AnimalDetail } from "@/features/animals/types";

const KIND_LABEL: Record<AnimalDetail["kind"], string> = {
  D: "강아지",
  C: "고양이",
};

const GENDER = {
  M: { label: "♂ 수컷", color: "#6B9FD4" },
  F: { label: "♀ 암컷", color: "#E88FA0" },
  Q: { label: "미상", color: "#9C8B75" },
} as const;

const FALLBACK_IMAGE =
  "https://placehold.co/600x600/FFF3D6/9C8B75?text=%F0%9F%90%BE";

export function AnimalDetailPage() {
  const { id } = useParams();
  const animalId = Number(id);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const { data: animal, isLoading, isError } = useAnimalDetailQuery(animalId);

  const {
    data: pendingApplication,
    isLoading: isPendingApplicationLoading,
  } = useMyPendingFosterApplication(animalId, Boolean(user));

  const { mutate: toggleLike, isPending: likePending } =
    useAnimalLikeMutation();

  if (isLoading) {
    return (
      <CenterScreen>
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </CenterScreen>
    );
  }

  if (isError || !animal) {
    return (
      <CenterScreen>
        <PawPrint size={32} className="text-muted-foreground/50" />
        <p className="mt-2 text-muted-foreground">
          동물 정보를 찾을 수 없어요.
        </p>
        <button
          onClick={() => navigate("/animals")}
          className="mt-3 rounded-full border border-border px-6 py-2 text-sm font-semibold text-muted-foreground hover:border-ring hover:text-ring"
        >
          목록으로
        </button>
      </CenterScreen>
    );
  }

  const gender = GENDER[animal.gender];

  const hasPendingApplication =
    pendingApplication?.hasPendingApplication ?? false;

  const isFosterApplyDisabled =
    animal.isFostered ||
    hasPendingApplication ||
    (Boolean(user) && isPendingApplicationLoading);

  const fosterButtonLabel = isPendingApplicationLoading
    ? "신청 상태를 확인 중이에요"
    : hasPendingApplication
      ? "내 임시보호 신청을 검토 중이에요"
      : animal.isFostered
        ? "이미 임시보호 중인 아이예요"
        : "임시보호 신청하기";

  const handleLikeToggle = () => {
    if (!user) {
      toast("로그인 후 좋아요할 수 있어요.");
      navigate("/login");
      return;
    }

    if (!likePending) {
      toggleLike({
        animalId: animal.animalId,
        currentlyLiked: animal.isLiked,
      });
    }
  };

  const handleFosterApply = () => {
    if (isFosterApplyDisabled) {
      return;
    }

    navigate(`/foster/apply/${animal.animalId}`);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-secondary py-8">
      <div className="mx-auto max-w-5xl px-6">
        <button
          onClick={() => navigate("/animals")}
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-ring"
        >
          <ArrowLeft size={16} /> 목록으로
        </button>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-white">
            <img
              src={animal.imageUrl ?? FALLBACK_IMAGE}
              alt={animal.nickname}
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = FALLBACK_IMAGE;
              }}
              className="aspect-square w-full object-cover"
            />
            <span
              className="absolute left-4 top-4 rounded-full px-3 py-1 text-sm font-bold text-white"
              style={{
                background: animal.isFostered ? "#9C8B75" : "#F4B942",
              }}
            >
              {animal.isFostered ? "임시보호중" : "임시보호가능"}
            </span>
          </div>

          <div className="flex flex-col">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <h1 className="text-3xl font-bold text-foreground">
                    {animal.nickname}
                  </h1>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-sm font-medium text-muted-foreground">
                    {KIND_LABEL[animal.kind]}
                  </span>
                </div>
                <p className="text-base text-muted-foreground">
                  {animal.typeName}
                </p>
              </div>

              <button
                onClick={handleLikeToggle}
                disabled={likePending}
                aria-pressed={animal.isLiked}
                className="flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold transition-all hover:scale-105 disabled:opacity-60"
              >
                <Heart
                  size={16}
                  className={
                    animal.isLiked ? "text-[#F87171]" : "text-muted-foreground"
                  }
                  fill={animal.isLiked ? "#F87171" : "none"}
                />
                <span
                  className={
                    animal.isLiked ? "text-[#F87171]" : "text-muted-foreground"
                  }
                >
                  {animal.likeCount}
                </span>
              </button>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-3 rounded-2xl border border-border bg-white p-5">
              <InfoItem label="성별">
                <span style={{ color: gender.color }}>{gender.label}</span>
              </InfoItem>
              <InfoItem label="나이">{animal.age}</InfoItem>
              <InfoItem label="몸무게">{animal.weight}</InfoItem>
              <InfoItem label="색상">{animal.color}</InfoItem>
              <InfoItem label="중성화 · 접종">
                <span className="inline-flex items-center gap-1">
                  <Syringe size={13} className="text-muted-foreground" />
                  {animal.vaccinationChk}
                </span>
              </InfoItem>
              <InfoItem label="발견지역">
                <span className="inline-flex items-center gap-1">
                  <MapPin size={13} className="text-muted-foreground" />
                  {animal.location}
                </span>
              </InfoItem>
            </div>

            <div className="mb-6 rounded-2xl border border-border bg-white p-5">
              <p className="mb-1.5 text-sm font-semibold text-[#C4B4A4]">
                특이사항
              </p>
              <p className="text-base leading-relaxed text-foreground">
                {animal.specialMark}
              </p>
            </div>

            <button
              onClick={handleFosterApply}
              disabled={isFosterApplyDisabled}
              className={`mt-auto flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold transition-all ${
                isFosterApplyDisabled
                  ? "cursor-not-allowed bg-muted text-muted-foreground"
                  : "bg-ring text-white hover:brightness-105"
              }`}
            >
              <HeartHandshake size={18} />
              {fosterButtonLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-0.5 text-xs font-medium text-[#C4B4A4]">{label}</p>
      <p className="text-sm font-semibold text-foreground">{children}</p>
    </div>
  );
}

function CenterScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-secondary text-center">
      {children}
    </div>
  );
}