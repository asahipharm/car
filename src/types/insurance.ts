export interface InsuranceCompany {
  name: string;
  url: string;
  color: string; // ロゴプレースホルダーの背景色
  initial: string; // ロゴプレースホルダーの文字
}

export const INSURANCE_COMPANIES: InsuranceCompany[] = [
  { name: "SBI損保",           url: "https://www.sbisonpo.co.jp",         color: "#e11d48", initial: "SBI" },
  { name: "ソニー損保",         url: "https://www.sonysonpo.co.jp",        color: "#1d4ed8", initial: "ソニー" },
  { name: "チューリッヒ保険",    url: "https://www.zurich.co.jp",           color: "#0f766e", initial: "ZUR" },
  { name: "楽天損保",           url: "https://www.rakuten-sonpo.co.jp",    color: "#bf0000", initial: "楽天" },
  { name: "おとなの自動車保険",  url: "https://www.otona-jidoshahoken.jp",  color: "#d97706", initial: "おとな" },
  { name: "三井ダイレクト損保",  url: "https://www.mitsui-direct.co.jp",   color: "#0369a1", initial: "三井" },
  { name: "アクサダイレクト",    url: "https://www.axa-direct.co.jp",      color: "#1e3a5f", initial: "AXA" },
  { name: "東京海上ダイレクト",  url: "https://www.tmn-direct.co.jp",      color: "#15803d", initial: "東京" },
  { name: "その他",             url: "",                                    color: "#64748b", initial: "他" },
];

export interface SharedInfo {
  licenseColor: string;       // "ゴールド" | "ブルー" | "グリーン" | "その他"
  accidentCount: number;      // 直近3年の事故回数
  currentGrade: number;       // 現在の等級
  carModel: string;           // 車種/型式（任意）
  currentMileage: number;     // 現在の走行距離（km）
  annualMileage: string;      // 1年間の予定走行距離
  registrationYear: number;   // 初度登録年（西暦、0 = 未設定）
  registrationMonth: number;  // 初度登録月（1-12、0 = 未設定）
}

export const DEFAULT_SHARED_INFO: SharedInfo = {
  licenseColor: "ゴールド",
  accidentCount: 0,
  currentGrade: 6,
  carModel: "",
  currentMileage: 0,
  annualMileage: "10,000km未満",
  registrationYear: 0,
  registrationMonth: 0,
};

export interface InsurancePlan {
  id: string;

  // 追加したときの共通条件スナップショット（警告判定に使用）
  sharedInfoSnapshot?: SharedInfo;

  // 基本構成
  company: string;
  premium: number;
  grade: number;
  ageCondition: string;
  drivingScope: string;
  accidentCoeffPeriod: string;  // 事故有係数適用期間

  // 補償内容
  liabilityPerson: string;
  liabilityProperty: string;
  propertyDeductible: string;
  propertyExcessRepair: boolean; // 対物超過修理費用特約
  personalInjury: string;
  passengerInjury: string;
  singleCarAccident: boolean;    // 自損事故傷害保険

  // 車両保険
  vehicleInsurance: boolean;
  vehicleType: string;
  vehicleAmount: string;
  vehicleDeductible: string;
  vehicleNewCar: boolean;       // 新車特約
  vehicleTotalLoss: boolean;    // 全損時諸費用保険金特約
  vehicleTheftRental: boolean;  // 車両盗難時レンタカー費用特約
  vehicleReplacement: boolean;  // 車両新価特約

  // その他特約
  legalSupport: boolean;
  roadService: boolean;
  familyBike: boolean;
  personalLiability: boolean;
  uninsuredCar: boolean;
  otherVehicleCoverage: boolean; // 他の自動車運転危険補償特約
  victimRelief: boolean;         // 被害者救済費用等補償特約
  homeGarageRepair: boolean;     // 自宅・車庫等修理費用補償特約
  bicycleAccident: boolean;      // 自転車事故補償特約
  personalBelongings: string;    // 車内外身の回り品補償特約（金額or「なし」）

  // 割引
  internetDiscount: boolean;
  paperlessDiscount: boolean;
  earlyDiscount: boolean;
  multiCarDiscount: boolean;
  telematicsDiscount: boolean;
  newCarDiscount: boolean;          // 新車割引
  safetySupportDiscount: boolean;   // セーフティ・サポートカー割引

  // メモ
  memo: string;
}

export const DEFAULT_PLAN: Omit<InsurancePlan, "id" | "company" | "premium" | "memo"> = {
  grade: 6,
  ageCondition: "26歳以上",
  drivingScope: "限定しない",
  accidentCoeffPeriod: "0年",
  liabilityPerson: "無制限",
  liabilityProperty: "無制限",
  propertyDeductible: "なし",
  propertyExcessRepair: false,
  personalInjury: "3000万円",
  passengerInjury: "なし",
  singleCarAccident: false,
  vehicleInsurance: false,
  vehicleType: "一般",
  vehicleAmount: "",
  vehicleDeductible: "5-10万円",
  vehicleNewCar: false,
  vehicleTotalLoss: false,
  vehicleTheftRental: false,
  vehicleReplacement: false,
  legalSupport: true,
  roadService: true,
  familyBike: false,
  personalLiability: false,
  uninsuredCar: true,
  otherVehicleCoverage: false,
  victimRelief: false,
  homeGarageRepair: false,
  bicycleAccident: false,
  personalBelongings: "なし",
  internetDiscount: false,
  paperlessDiscount: false,
  earlyDiscount: false,
  multiCarDiscount: false,
  telematicsDiscount: false,
  newCarDiscount: false,
  safetySupportDiscount: false,
};

export interface FieldMeta {
  key: keyof InsurancePlan;
  label: string;
  category: string;
  format?: (val: InsurancePlan[keyof InsurancePlan]) => string;
}

const bool = (v: InsurancePlan[keyof InsurancePlan]) =>
  v ? "あり" : "なし";

export const FIELD_METAS: FieldMeta[] = [
  // 基本構成
  { key: "company",          label: "保険会社",       category: "基本構成" },
  { key: "premium",          label: "年間保険料",      category: "基本構成", format: (v) => `¥${Number(v).toLocaleString()}` },
  { key: "grade",            label: "等級",           category: "基本構成", format: (v) => `${v}等級` },
  { key: "ageCondition",        label: "年齢条件",              category: "基本構成" },
  { key: "drivingScope",        label: "運転範囲",              category: "基本構成" },
  { key: "accidentCoeffPeriod", label: "事故有係数適用期間",    category: "基本構成" },
  // 補償内容
  { key: "liabilityPerson",     label: "対人賠償",              category: "補償内容" },
  { key: "liabilityProperty",   label: "対物賠償",              category: "補償内容" },
  { key: "propertyDeductible",  label: "対物免責",              category: "補償内容" },
  { key: "propertyExcessRepair",label: "対物超過修理費用特約",  category: "補償内容", format: bool },
  { key: "personalInjury",      label: "人身傷害",              category: "補償内容" },
  { key: "passengerInjury",     label: "搭乗者傷害",            category: "補償内容" },
  { key: "singleCarAccident",   label: "自損事故傷害保険",      category: "補償内容", format: bool },
  // 車両保険
  { key: "vehicleInsurance",    label: "車両保険",              category: "車両保険", format: bool },
  { key: "vehicleType",         label: "車両保険種類",          category: "車両保険" },
  { key: "vehicleAmount",       label: "車両保険金額",          category: "車両保険", format: (v) => v ? `¥${Number(v).toLocaleString()}` : "—" },
  { key: "vehicleDeductible",   label: "車両免責金額",          category: "車両保険" },
  { key: "vehicleNewCar",       label: "新車特約",              category: "車両保険", format: bool },
  { key: "vehicleTotalLoss",    label: "全損時諸費用特約",      category: "車両保険", format: bool },
  { key: "vehicleTheftRental",  label: "盗難時レンタカー特約",  category: "車両保険", format: bool },
  { key: "vehicleReplacement",  label: "車両新価特約",          category: "車両保険", format: bool },
  // その他特約
  { key: "legalSupport",        label: "弁護士費用特約",        category: "その他特約", format: bool },
  { key: "roadService",         label: "ロードサービス",        category: "その他特約", format: bool },
  { key: "familyBike",          label: "ファミリーバイク特約",  category: "その他特約", format: bool },
  { key: "personalLiability",   label: "個人賠償責任特約",      category: "その他特約", format: bool },
  { key: "uninsuredCar",        label: "無保険車傷害",          category: "その他特約", format: bool },
  { key: "otherVehicleCoverage",label: "他車運転危険補償特約",  category: "その他特約", format: bool },
  { key: "victimRelief",        label: "被害者救済費用等特約",  category: "その他特約", format: bool },
  { key: "homeGarageRepair",    label: "自宅・車庫修理費用特約",category: "その他特約", format: bool },
  { key: "bicycleAccident",     label: "自転車事故補償特約",    category: "その他特約", format: bool },
  { key: "personalBelongings",  label: "身の回り品補償特約",    category: "その他特約" },
  // 割引
  { key: "internetDiscount",    label: "インターネット割引",    category: "割引", format: bool },
  { key: "paperlessDiscount",   label: "証券不発行割引",        category: "割引", format: bool },
  { key: "earlyDiscount",       label: "早期割引",              category: "割引", format: bool },
  { key: "multiCarDiscount",    label: "複数台割引",            category: "割引", format: bool },
  { key: "telematicsDiscount",  label: "テレマティクス割引",    category: "割引", format: bool },
  { key: "newCarDiscount",      label: "新車割引",              category: "割引", format: bool },
  { key: "safetySupportDiscount",label:"セーフティ割引",        category: "割引", format: bool },
  // メモ
  { key: "memo",               label: "メモ",                category: "メモ" },
];
