/**
 * Phase 4.8: チェックリスト関連のユーティリティ関数
 */

import type {
  RequirementChecklistItem,
  PhaseRequirements,
  ChecklistStatus,
  ButtonReadiness,
  ButtonReadinessLevel,
} from "@/types/requirements";

/**
 * チェックリストの状態を計算
 */
export function calculateChecklistStatus(
  items: RequirementChecklistItem[],
  requirements: PhaseRequirements
): ChecklistStatus {
  // 必須項目とオプション項目を分離
  const requiredItems = items.filter((item) => item.required);
  const optionalItems = items.filter((item) => !item.required);

  // 必須項目の充足数
  const requiredFilled = requiredItems.filter(
    (item) => item.status === "filled"
  ).length;

  // オプション項目の充足数
  const optionalFilled = optionalItems.filter(
    (item) => item.status === "filled"
  ).length;

  // すべての必須項目が充足されているか
  const allRequiredFilled =
    requiredItems.length === 0 || requiredFilled === requiredItems.length;

  // 不足している必須項目のリスト
  const missingRequired = requiredItems
    .filter((item) => item.status !== "filled")
    .map((item) => item.label);

  // 全体の充足率を計算
  const totalItems = items.length;
  const totalFilled = requiredFilled + optionalFilled;
  const completionRate =
    totalItems === 0 ? 0 : Math.round((totalFilled / totalItems) * 100);

  // 推奨されるアクション
  const recommendedAction: "proceed" | "collect_more" | "wait" =
    allRequiredFilled ? "proceed" : "collect_more";

  return {
    completionRate,
    allRequiredFilled,
    requiredFilled,
    requiredTotal: requiredItems.length,
    optionalFilled,
    optionalTotal: optionalItems.length,
    missingRequired,
    recommendedAction,
  };
}

/**
 * ボタンの準備度を決定
 */
export function determineButtonReadiness(
  status: ChecklistStatus
): ButtonReadiness {
  const { allRequiredFilled, missingRequired, completionRate } = status;

  let level: ButtonReadinessLevel;
  let color: "green" | "blue" | "gray";
  let animate: boolean;
  let tooltip: string;

  if (allRequiredFilled) {
    // すべての必須情報が揃っている
    level = "ready";
    color = "green";
    animate = true;
    tooltip = "必要な情報が揃いました！";
  } else {
    // 情報が不足
    level = "not_ready";
    color = "gray";
    animate = false;
    tooltip = `次へ進むには、${missingRequired.join("、")}の情報が必要です`;
  }

  return {
    level,
    label: "自動作成を開始",
    color,
    animate,
    tooltip,
    missingInfo: missingRequired.length > 0 ? missingRequired : undefined,
  };
}

/**
 * チェックリスト項目の値を文字列にフォーマット
 */
export function formatChecklistValue(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return value.toString();
  }

  if (typeof value === "boolean") {
    return value ? "はい" : "いいえ";
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "";
    }
    return value.join("、");
  }

  if (typeof value === "object") {
    // traveler オブジェクトの場合
    if ("count" in value && "type" in value) {
      const typeLabels: Record<string, string> = {
        solo: "一人旅",
        couple: "カップル",
        family: "家族",
        friends: "友人",
      };
      const typeLabel = typeLabels[value.type] || "";
      return `${value.count}人${typeLabel ? `（${typeLabel}）` : ""}`;
    }

    // 他のオブジェクトの場合はJSON文字列化
    return JSON.stringify(value);
  }

  return String(value);
}
