# 웨이지 계산기 개발 기획문서 v3

> NSW(호주 뉴사우스웨일스) 캐주얼 노동자 주급 계산 웹앱  
> **PAYG 원천징수 정확 계산 + 회계연도 누적 + 예상 환급액 표시**

---

## ⭐ v3 주요 업데이트
- **PAYG 시스템 정확한 이해** 섹션 추가 (12장)
- **PAYG 주별 정확 계산 로직** 추가 (3장)
- **회계연도 누적 추적 + 예상 환급액 표시** 기능 추가 (2.7장)
- **하단 요약바 3줄로 확장** (Gross / PAYG / Net + 추가 정보)

---

## 1. 프로젝트 개요

### 1.1 목적
호주 NSW에서 일하는 사용자가 시급을 입력하고 매일 근무를 기록하면, **주별 세전 주급(Gross) / PAYG 원천징수액 / 실수령액(Net)을 실시간 계산**하고, 추가로 **회계연도 누적 합계와 예상 환급액**까지 보여주는 웹앱.

### 1.2 핵심 가치
- 빠른 입력 (15분 단위)
- 평일/주말/공휴일 자동 구분
- **PAYG 정확 계산** (고용주 페이슬립과 거의 일치)
- **연 환산 + 예상 환급/추가납부 추정** ← v3 신규

---

## 2. 기능 명세

### 2.1 Settings (한 번 설정)

| 항목 | 형식 | 기본값 |
|------|------|--------|
| 평일 시급 | 숫자 (AUD) | 없음 (필수) |
| 주말 배율 | 숫자 | 1.25 |
| 공휴일 배율 | 숫자 | 2.0 |
| 세무 분류 | 드롭다운 | Resident |
| TFN 제출 여부 (WHM 시) | 토글 | true |
| 고용주 WHM 등록 (WHM 시) | 토글 | true |
| Medicare Levy (Resident 시) | 토글 | true |
| HELP/HECS 학자금 대출 보유 | 토글 | false |
| 회계연도 | 자동 감지 | 2025–26 |

### 2.2 세무 분류 옵션 (v2 동일)

**① Resident** _기본값_  
> _"영주권, 시민권, 학생비자(6개월+), 485비자, 482비자 등."_

**② Working Holiday Maker**  
> _"비자 417 또는 462."_

**③ Foreign Resident**  
> _"단기체류, 등록 안 된 고용주 워홀러."_

🔗 [ATO 거주성 판단 도구](https://www.ato.gov.au/calculators-and-tools/tax-return-work-out-your-tax-residency)

### 2.3 비자별 가이드 (v2 동일)

| 비자 | 일반적 카테고리 |
|------|---------------|
| 영주권/시민권 | Resident |
| 학생비자 (6개월+ 코스) | Resident |
| **485 (Temporary Graduate)** | **Resident** |
| 482 (Skilled Work) | Resident |
| 417/462 (Working Holiday) | WHM |
| 단기/6개월 미만 | Foreign Resident |

### 2.4 주 단위 근무 입력

| 필드 | 형식 | 제약 |
|------|------|------|
| 시작 시간 | 15분 단위 드롭다운 | - |
| 브레이크 (분) | 15분 단위 | 60~150 |
| 종료 시간 | 15분 단위 드롭다운 | 시작보다 뒤 |

### 2.5 요일 타입 자동 판별
1. NSW 공휴일 → Public Holiday (× 2.0)
2. 토/일 → Weekend (× 1.25)
3. 그 외 → Weekday (× 1.0)

### 2.6 주 선택
- 기본값: 현재 주 (월~일)
- 이전/다음 주 이동
- 회계연도(7/1~6/30) 자동 감지

### 2.7 ⭐ 회계연도 누적 추적 (v3 신규)

매주 입력한 데이터를 회계연도 단위로 누적해서, **연간 예상 세금 vs PAYG 누적 원천징수**를 비교해 환급/추가납부 예상액 표시.

```
회계연도 2025–26 진행 상황
────────────────────────────────
누적 Gross         $24,500
누적 PAYG 원천징수   $3,250
실수령 누적         $21,250

예상 연간 Gross 추정  $42,000  (현재 페이스로)
예상 연간 세금       $3,808
예상 환급액 ✅       +$840   (PAYG 누적 - 실제 세금)
```

> 💡 이건 페이지 상단 또는 별도 "Year Summary" 탭에 표시.

### 2.8 하단 고정 요약바 (3줄)

```
┌─────────────────────────────────────────┐
│  📊 38.5h · Gross $987.50               │
│  💸 PAYG -$157.25 · Net $830.25         │
│  📅 YTD Gross $24,500 · Refund est. +$840│
└─────────────────────────────────────────┘
```

---

## 3. 계산 로직

### 3.1 일별/주별 Gross (변경 없음)
```
daily_minutes = (end_time - start_time) - break_minutes
daily_hours   = daily_minutes / 60
daily_pay     = daily_hours × rate × multiplier
weekly_gross  = sum(daily_pay)
```

### 3.2 ⭐ 주별 PAYG 원천징수 계산 (v3 정확 로직)

**핵심 원리:** ATO PAYG는 "이 주급을 1년(52주) 동안 받는다고 가정"하고 연간 세금을 계산한 뒤 52로 나눔.

```typescript
function calculateWeeklyPAYG(
  weeklyGross: number,
  config: TaxConfig
): number {
  // 1. 연 환산 (52배)
  const annualisedIncome = weeklyGross * 52;
  
  // 2. 카테고리별 연 세금 계산
  let annualTax = applyTaxBrackets(annualisedIncome, config);
  
  // 3. Resident 추가 항목
  if (config.category === 'resident') {
    if (config.applyMedicareLevy) {
      annualTax += annualisedIncome * 0.02;
    }
    if (config.applyLITO) {
      annualTax -= calculateLITO(annualisedIncome);
    }
  }
  
  // 4. HELP/HECS 추가 (있으면)
  if (config.hasHELPDebt) {
    annualTax += calculateHELPRepayment(annualisedIncome);
  }
  
  // 5. WHM 예외 처리
  if (config.category === 'whm') {
    if (!config.tfnSubmitted) return weeklyGross * 0.45; // 45% flat
    if (!config.employerRegistered) {
      // Foreign Resident 세율 적용
      return calculateWeeklyPAYG(weeklyGross, { 
        ...config, 
        category: 'foreign_resident' 
      });
    }
  }
  
  // 6. 52로 나눠서 주간 PAYG 산출
  return Math.max(0, annualTax / 52);
}
```

### 3.3 LITO 계산 (Resident만)

```typescript
function calculateLITO(annualIncome: number): number {
  if (annualIncome <= 37500) return 700;
  if (annualIncome <= 45000) {
    return 700 - (annualIncome - 37500) * 0.05;
  }
  if (annualIncome <= 66667) {
    return 325 - (annualIncome - 45000) * 0.015;
  }
  return 0;
}
```

### 3.4 ⭐ 회계연도 누적 + 환급 추정 (v3 신규)

```typescript
function calculateYTDSummary(
  fy: string,                    // '2025-26'
  weeks: WeekSummary[],
  config: TaxConfig
): YTDSummary {
  const ytdGross = sum(weeks.map(w => w.gross));
  const ytdPAYG  = sum(weeks.map(w => w.payg));
  
  // 현재 회계연도 진행률 (1=100%)
  const fyProgress = getFYProgress(fy); // 예: 0.81 (10월 = 약 31%)
  
  // 페이스 기준 연 추정 Gross
  const estimatedAnnualGross = ytdGross / fyProgress;
  
  // 추정 연간 실제 세금
  const estimatedAnnualTax = calculateAnnualTax(
    estimatedAnnualGross, 
    config
  );
  
  // 회계연도 끝까지 페이스대로 갔을 때 누적될 PAYG
  const estimatedAnnualPAYG = ytdPAYG / fyProgress;
  
  // 예상 환급/추가납부
  const expectedRefund = estimatedAnnualPAYG - estimatedAnnualTax;
  
  return {
    ytdGross,
    ytdPAYG,
    estimatedAnnualGross,
    estimatedAnnualTax,
    expectedRefund, // +면 환급, -면 추가 납부
  };
}
```

### 3.5 회계연도(FY) 처리

호주 FY는 **7월 1일 ~ 다음 해 6월 30일**.

```typescript
function getCurrentFY(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  
  if (month >= 7) {
    return `${year}-${(year + 1).toString().slice(-2)}`; 
    // 2025-26
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`;
    // 2026 1월이면 2025-26
  }
}

function getFYProgress(fy: string, today: Date): number {
  const [startYear] = fy.split('-').map(Number);
  const fyStart = new Date(startYear, 6, 1);  // 7/1
  const fyEnd   = new Date(startYear + 1, 5, 30); // 6/30
  
  const elapsed = today.getTime() - fyStart.getTime();
  const total   = fyEnd.getTime() - fyStart.getTime();
  
  return Math.min(1, Math.max(0, elapsed / total));
}
```

---

## 4. 화면 구성

### 4.1 메인 화면
```
┌─────────────────────────────────────────┐
│  Wage Calculator    📅 YTD  ⚙️ Settings │
├─────────────────────────────────────────┤
│  ← Week of Apr 20 - Apr 26, 2026  →    │
├─────────────────────────────────────────┤
│  Mon 20 Apr  [Weekday]                  │
│    Start: [09:00▼]  End: [17:00▼]       │
│    Break: [60 min ▼]                    │
│    → 7.0h · Gross $210 · Net $176       │
├─────────────────────────────────────────┤
│  ...                                     │
├─────────────────────────────────────────┤
│ 📊 38.5h · Gross $987.50                │
│ 💸 PAYG -$157.25 · Net $830.25          │
│ 📅 FY25-26: $24,500 · Refund est.+$840  │
└─────────────────────────────────────────┘
```

### 4.2 YTD (Year Summary) 화면
```
┌─────────────────────────────────────────┐
│  Financial Year 2025–26          ✕      │
├─────────────────────────────────────────┤
│  Progress: ████████░░░░  81%            │
│  (Jul 1 → Apr 26)                        │
├─────────────────────────────────────────┤
│  📈 Year-to-date                        │
│    Gross earned:        $24,500.00      │
│    PAYG withheld:        $3,250.00      │
│    Take-home:           $21,250.00      │
├─────────────────────────────────────────┤
│  🔮 Annual estimate (current pace)      │
│    Estimated Gross:     $42,000.00      │
│    Estimated tax:        $3,808.00      │
│    Estimated PAYG:       $4,650.00      │
├─────────────────────────────────────────┤
│  💰 Expected Refund     +$840.00 ✅     │
│                                          │
│  ℹ️ This is an estimate only. Actual    │
│     refund depends on deductions,       │
│     offsets, and your tax return.       │
└─────────────────────────────────────────┘
```

---

## 5. 데이터 저장 (v2 동일)

```
wage-calc:settings  → RateSettings + TaxConfig
wage-calc:weeks     → { "2026-W17": [WorkDay, ...] }
```

새로 추가:
```
wage-calc:ytd-cache → { "2025-26": YTDSummary }  // 옵션, 성능 캐싱용
```

---

## 6. 기술 스택 (v2 동일)

Next.js 14 + TypeScript + Tailwind + shadcn/ui + date-fns + Vercel

---

## 7. 프로젝트 구조

```
wage-calculator/
├── app/
│   ├── page.tsx
│   ├── settings/page.tsx
│   ├── ytd/page.tsx              ← v3 신규
│   └── layout.tsx
├── components/
│   ├── WeekNavigator.tsx
│   ├── DayCard.tsx
│   ├── TimeSelect.tsx
│   ├── BreakSelect.tsx
│   ├── TaxCategorySelect.tsx
│   ├── SummaryBar.tsx
│   └── YTDSummary.tsx            ← v3 신규
├── lib/
│   ├── calculations.ts
│   ├── tax.ts                    ← PAYG 계산 핵심
│   ├── lito.ts                   ← v3 신규
│   ├── help-debt.ts              ← v3 신규 (HELP 상환)
│   ├── ytd.ts                    ← v3 신규
│   ├── holidays.ts
│   ├── date-helpers.ts           ← FY 계산 포함
│   └── storage.ts
├── data/
│   ├── public-holidays.json
│   └── tax-brackets.json
└── types/
    └── index.ts
```

---

## 8. 타입 정의

```typescript
type DayType = 'weekday' | 'weekend' | 'public_holiday';
type TaxCategory = 'resident' | 'whm' | 'foreign_resident';

interface WorkDay {
  date: string;
  dayType: DayType;
  startTime: string | null;
  endTime: string | null;
  breakMinutes: number;
}

interface RateSettings {
  weekdayRate: number;
  weekendMultiplier: number;
  holidayMultiplier: number;
}

interface TaxConfig {
  financialYear: string;
  category: TaxCategory;
  applyMedicareLevy?: boolean;
  applyLITO?: boolean;
  hasHELPDebt?: boolean;          // v3 신규
  tfnSubmitted?: boolean;
  employerRegistered?: boolean;
}

interface WeekSummary {
  weekId: string;                 // '2026-W17'
  totalHours: number;
  gross: number;
  payg: number;                   // v3: weeklyTax → payg로 명명 변경
  net: number;
}

// v3 신규
interface YTDSummary {
  fy: string;
  ytdGross: number;
  ytdPAYG: number;
  ytdNet: number;
  fyProgress: number;             // 0~1
  estimatedAnnualGross: number;
  estimatedAnnualTax: number;
  estimatedAnnualPAYG: number;
  expectedRefund: number;         // +환급, -추가납부
}
```

---

## 9. 유효성 검사 (v2 동일)

---

## 10. 개발 로드맵

### Phase 1 - MVP (3~4일)
- [ ] Next.js 세팅 + Tailwind + shadcn/ui
- [ ] 타입 정의
- [ ] NSW 2026 공휴일 JSON
- [ ] 2025-26 세율 JSON (Resident/WHM/Foreign × Resident 옵션)
- [ ] `lib/calculations.ts` (Gross)
- [ ] `lib/tax.ts` (PAYG 계산 - 정확 로직)
- [ ] `lib/lito.ts`
- [ ] `lib/date-helpers.ts` (FY 처리)
- [ ] Settings 페이지
- [ ] 메인 타임시트
- [ ] 하단 요약바 (3줄)

### Phase 2 - YTD 기능 (1~2일)
- [ ] `lib/ytd.ts` (누적 + 환급 추정)
- [ ] YTD 페이지/모달
- [ ] 회계연도 자동 전환 (7/1)

### Phase 3 - 배포
- [ ] GitHub + Vercel
- [ ] 모바일 반응형 점검

### Phase 4 - 확장 (선택)
- [ ] HELP/HECS 학자금 상환 정확 계산
- [ ] ATO Schedule 1 공식 PAYG formula 적용 (정밀화)
- [ ] Superannuation 12% 표시
- [ ] 공제 항목 입력 (work-related deductions)
- [ ] 데이터 export/import

---

## 11. 면책 조항 (UI 필수 표시)

> _"This calculator provides PAYG withholding estimates based on simplified annualisation. Actual amounts withheld by your employer may differ slightly due to ATO Schedule 1 lookup tables, rounding, and pay frequency adjustments. Refund estimates assume current earning pace continues and don't account for deductions, offsets, multiple employers, or other income. For accurate figures:_
> - _[ATO Tax Withheld Calculator](https://www.ato.gov.au/calculators-and-tools/tax-withheld-calculator)_
> - _[ATO Simple Tax Calculator](https://www.ato.gov.au/calculators-and-tools/tax-return-simple-tax-calculator)_  
> - _[Fair Work Pay Calculator](https://calculate.fairwork.gov.au/findyouraward)_
>
> _Or consult a registered tax agent."_

---

## 12. ⭐ PAYG 시스템 정확한 이해 (v3 신규 - 핵심 챕터)

### 12.1 호주 세금은 두 단계
```
[ 매 페이마다 ]              [ 회계연도 종료 후 ]
   PAYG 원천징수      →         Tax Return
   (실시간 추정)               (정확한 정산)
   
   고용주가 떼서                ATO에 신고하고
   ATO에 송금                  환급 or 추가납부
```

### 12.2 PAYG (Pay As You Go) 원천징수란?

고용주가 우리에게 페이 줄 때 **그 한 주의 소득을 1년 환산해서** 거기에 맞는 세금을 미리 떼는 시스템.

**예: WHM이 이번 주 $1,000 벌었을 때**
```
1. $1,000 × 52주 = $52,000 (연 환산)
2. WHM 세율 적용:
   - 첫 $45,000 × 15% = $6,750
   - 나머지 $7,000 × 30% = $2,100
   - 합계 $8,850
3. $8,850 ÷ 52주 = $170.19  ← 이번 주 떼임
4. 실수령 = $1,000 - $170.19 = $829.81
```

### 12.3 왜 환급/추가납부가 발생하나?

**핵심 원인: PAYG는 "그 주 소득이 1년 내내 같다"고 가정**

캐주얼은 주마다 시간이 다르기 때문에:

#### 케이스 A: 환급이 자주 발생하는 경우 (Resident)
- 어떤 주 $1,500 → 연 환산 $78,000 가정 → 높은 세율로 떼임
- 어떤 주 $300 → 연 환산 $15,600 가정 → 면세 구간이라 안 떼임 (또는 적게)
- 1년 평균 $35,000 정도 벌었다면 **실제 세금은 면세 구간 + 16%만 적용**
- 그런데 PAYG는 변동을 평탄화하지 못해서 **평균보다 더 떼이는 경향**
- → **회계연도 끝나면 환급** ✅

#### 케이스 B: 추가 납부가 발생하는 경우
- 두 군데에서 일하면서 둘 다 tax-free threshold(면세 구간)을 적용받음
- 또는 부업 소득이 있는데 본업에서만 PAYG 떼임
- → **회계연도 끝나면 추가 납부** ❌

### 12.4 예상 환급액이란?

웨이지 계산기의 "예상 환급액"은:
```
예상 환급액 = 누적 PAYG 원천징수 - 예상 연간 실제 세금
              (현재 페이스 유지 가정)
```

**100% 정확하지 않은 이유:**
1. 미래 근무 시간이 다를 수 있음
2. 공제 항목(work-related deductions) 미반영
3. 다른 소득 원천 미반영
4. ATO Schedule 1 공식 테이블과 약간의 차이 (반올림 등)

**그래도 보여주는 이유:**
- 사용자에게 "이대로 가면 환급/추납 어느 쪽일지" 감을 줌
- 캐주얼 노동자는 대부분 **환급 받는 경우가 많아** 동기 부여
- 학자금 대출(HELP) 있는 경우 추납 위험 미리 인지

### 12.5 PAYG 계산 정확도 (이 앱 vs 실제)

| 항목 | 이 앱 (단순화) | ATO 공식 | 차이 |
|------|--------------|---------|------|
| 기본 세율 적용 | ✅ 정확 | ✅ | 0 |
| Medicare Levy | 단순 2% | 저소득 감면 반영 | 저소득자에서 약간 차이 |
| LITO | 적용 | 적용 안 함 (return에서 처리) | **PAYG에는 LITO 미적용이 정확** |
| 반올림 | 소수점 유지 | 1불 단위 반올림 | $0.50 이내 |
| Schedule 1 lookup | 공식 사용 | 테이블 참조 | $1~3 차이 가능 |

> ⚠️ **수정 필요**: PAYG 계산 시 LITO는 **빼면 안 됨**. ATO PAYG는 LITO 안 적용한 채로 떼고, tax return 때 적용. → `lib/tax.ts`에서 PAYG와 annualTax 계산 로직 분리 필요.

### 12.6 ⭐ 수정된 계산 로직

```typescript
// PAYG 원천징수 (매주 떼는 것) - LITO 미적용
function calculateWeeklyPAYG(weeklyGross, config): number {
  const annualised = weeklyGross * 52;
  let tax = applyTaxBrackets(annualised, config);
  
  if (config.category === 'resident' && config.applyMedicareLevy) {
    tax += annualised * 0.02;
  }
  // ❌ LITO 적용 안 함
  
  return Math.max(0, tax / 52);
}

// 연간 실제 세금 (Tax Return용) - LITO 적용
function calculateActualAnnualTax(annualGross, config): number {
  let tax = applyTaxBrackets(annualGross, config);
  
  if (config.category === 'resident') {
    if (config.applyMedicareLevy) {
      tax += annualGross * 0.02;
    }
    if (config.applyLITO) {
      tax -= calculateLITO(annualGross);  // ✅ 여기서만 적용
    }
  }
  
  return Math.max(0, tax);
}

// → 환급 = (매주 PAYG로 떼인 것 합계) - (실제 연간 세금 with LITO)
//   = LITO 적용 안 한 PAYG 누적 - LITO 적용한 실제 세금
//   = 자연스럽게 LITO만큼 환급 발생
```

### 12.7 회계연도 종료 시 흐름

```
6월 30일: 회계연도 종료
       ↓
7월 ~ 10월 31일: Tax Return 신고 기간
       ↓
myGov 또는 tax agent로 신고
       ↓
ATO가 정산
       ↓
환급: 보통 신고 후 2주 이내 입금
추납: Notice of Assessment 발급, 11월 21일까지 납부
```

---

## 13. 참고 링크

### ATO 공식
- 🔗 [Tax Tables 2025-26](https://www.ato.gov.au/tax-rates-and-codes/previous-years-tax-tables/tax-tables-for-2025-26)
- 🔗 [Tax Withheld Calculator (PAYG 추정)](https://www.ato.gov.au/calculators-and-tools/tax-withheld-calculator)
- 🔗 [Simple Tax Calculator (연 세금)](https://www.ato.gov.au/calculators-and-tools/tax-return-simple-tax-calculator)
- 🔗 [Income Tax Estimator (환급액 추정)](https://www.ato.gov.au/calculators-and-tools/income-tax-estimator)
- 🔗 [Resident 세율 (2025–26)](https://www.ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents)
- 🔗 [Foreign Resident 세율](https://www.ato.gov.au/tax-rates-and-codes/tax-rates-foreign-residents)
- 🔗 [Working Holiday Maker 세율](https://www.ato.gov.au/tax-rates-and-codes/tax-rates-working-holiday-makers)
- 🔗 [Schedule 1 - PAYG 공식](https://www.ato.gov.au/tax-rates-and-codes/tax-tables-overview)
- 🔗 [Schedule 15 - WHM PAYG](https://www.ato.gov.au/tax-rates-and-codes/schedule-15-tax-table-for-working-holiday-makers)
- 🔗 [Weekly Tax Table (NAT 1005)](https://www.ato.gov.au/tax-rates-and-codes/tax-table-weekly)

### 거주성 / 일반
- 🔗 [Are you a resident? 도구](https://www.ato.gov.au/calculators-and-tools/tax-return-work-out-your-tax-residency)
- 🔗 [Foreign and temporary residents](https://www.ato.gov.au/individuals-and-families/coming-to-australia-or-going-overseas/your-tax-residency/foreign-and-temporary-residents)

### NSW / Fair Work
- 🔗 [NSW Public Holidays](https://www.nsw.gov.au/about-nsw/public-holidays)
- 🔗 [Fair Work Pay Calculator](https://calculate.fairwork.gov.au/findyouraward)

---

## 14. Claude Code 프롬프트 (v3)

```
@spec-v3.md 이 기획문서로 개발 진행 중. 
v3에서 PAYG 정확 계산 로직 + YTD 누적/환급 추정 기능이 추가됐어.

지금 [현재 진행 단계]까지 됐고, 다음으로:
- lib/tax.ts에서 calculateWeeklyPAYG(LITO 미적용)와 
  calculateActualAnnualTax(LITO 적용)를 분리해서 구현
- lib/ytd.ts에 회계연도 누적 + 환급 추정 함수 작성
- YTD 페이지 UI 만들기

각 단계마다 멈추고 결과 확인하자.
```

---

**문서 버전:** v3.0  
**작성일:** 2026-04-26  
**적용 회계연도:** 2025–26
