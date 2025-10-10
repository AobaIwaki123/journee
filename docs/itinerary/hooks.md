# カスタムHooks仕様

## 提案する新しいHooks

### 1. `useItineraryEditor` - しおり編集ロジック

**目的**: しおりの基本的な編集操作をカプセル化

**ファイルパス**: `lib/hooks/itinerary/useItineraryEditor.ts`

```typescript
interface UseItineraryEditorOptions {
  itineraryId?: string;
  autoSave?: boolean;
  autoSaveInterval?: number; // milliseconds
}

interface UseItineraryEditorReturn {
  // State
  itinerary: ItineraryData | null;
  isLoading: boolean;
  isSaving: boolean;
  lastSaveTime: Date | null;
  hasUnsavedChanges: boolean;
  
  // Basic operations
  updateTitle: (title: string) => void;
  updateDestination: (destination: string) => void;
  updateDates: (startDate: string, endDate: string) => void;
  updateSummary: (summary: string) => void;
  
  // Save operations
  save: () => Promise<void>;
  saveAs: (newTitle: string) => Promise<string>; // returns new ID
  
  // History operations
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function useItineraryEditor(
  options?: UseItineraryEditorOptions
): UseItineraryEditorReturn
```

**使用例**:
```tsx
function ItineraryEditor() {
  const {
    itinerary,
    updateTitle,
    save,
    hasUnsavedChanges,
    undo,
    canUndo
  } = useItineraryEditor({
    autoSave: true,
    autoSaveInterval: 30000 // 30秒
  });
  
  return (
    <div>
      <input 
        value={itinerary?.title} 
        onChange={(e) => updateTitle(e.target.value)} 
      />
      {hasUnsavedChanges && <button onClick={save}>保存</button>}
      {canUndo && <button onClick={undo}>元に戻す</button>}
    </div>
  );
}
```

---

### 2. `useSpotEditor` - スポット編集ロジック

**目的**: 観光スポットの追加・編集・削除・並び替えをカプセル化

**ファイルパス**: `lib/hooks/itinerary/useSpotEditor.ts`

```typescript
interface UseSpotEditorReturn {
  // Spot operations
  addSpot: (dayIndex: number, spot: Omit<TouristSpot, 'id'>) => void;
  updateSpot: (dayIndex: number, spotId: string, updates: Partial<TouristSpot>) => void;
  deleteSpot: (dayIndex: number, spotId: string) => void;
  
  // Reordering
  reorderSpots: (dayIndex: number, fromIndex: number, toIndex: number) => void;
  moveSpot: (fromDayIndex: number, toDayIndex: number, spotId: string) => void;
  
  // Batch operations
  addMultipleSpots: (dayIndex: number, spots: Omit<TouristSpot, 'id'>[]) => void;
  deleteMultipleSpots: (dayIndex: number, spotIds: string[]) => void;
  
  // Validation
  validateSpot: (spot: Partial<TouristSpot>) => ValidationResult;
}

export function useSpotEditor(): UseSpotEditorReturn
```

**使用例**:
```tsx
function SpotManager({ dayIndex }: { dayIndex: number }) {
  const { addSpot, deleteSpot, reorderSpots } = useSpotEditor();
  
  const handleAddSpot = (spotData: Omit<TouristSpot, 'id'>) => {
    addSpot(dayIndex, spotData);
  };
  
  return <AddSpotForm onSubmit={handleAddSpot} />;
}
```

---

### 3. `useItinerarySave` - 保存ロジック

**目的**: DB/LocalStorageへの保存処理をカプセル化

**ファイルパス**: `lib/hooks/itinerary/useItinerarySave.ts`

```typescript
interface UseItinerarySaveOptions {
  autoSave?: boolean;
  autoSaveInterval?: number;
  storage?: 'database' | 'localStorage' | 'auto'; // auto = DB if logged in
}

interface UseItinerarySaveReturn {
  // State
  isSaving: boolean;
  lastSaveTime: Date | null;
  saveError: Error | null;
  
  // Operations
  save: (mode?: 'overwrite' | 'new') => Promise<SaveResult>;
  load: (id: string) => Promise<ItineraryData>;
  delete: (id: string) => Promise<void>;
  
  // Auto-save control
  enableAutoSave: () => void;
  disableAutoSave: () => void;
  triggerAutoSave: () => Promise<void>;
}

interface SaveResult {
  success: boolean;
  itineraryId: string;
  message?: string;
  error?: string;
}

export function useItinerarySave(
  options?: UseItinerarySaveOptions
): UseItinerarySaveReturn
```

**使用例**:
```tsx
function AutoSaveIndicator() {
  const { isSaving, lastSaveTime, enableAutoSave } = useItinerarySave({
    autoSave: true,
    autoSaveInterval: 30000
  });
  
  useEffect(() => {
    enableAutoSave();
  }, []);
  
  return (
    <div>
      {isSaving ? '保存中...' : `最終保存: ${lastSaveTime}`}
    </div>
  );
}
```

---

### 4. `useItineraryPublish` - 公開・共有ロジック

**目的**: しおりの公開設定とURL生成をカプセル化

**ファイルパス**: `lib/hooks/itinerary/useItineraryPublish.ts`

```typescript
interface UseItineraryPublishReturn {
  // State
  isPublic: boolean;
  publicUrl: string | null;
  publicSlug: string | null;
  isPublishing: boolean;
  
  // Settings
  allowPdfDownload: boolean;
  customMessage: string;
  
  // Operations
  publish: (settings: PublicItinerarySettings) => Promise<PublishResult>;
  unpublish: () => Promise<void>;
  updateSettings: (settings: Partial<PublicItinerarySettings>) => Promise<void>;
  
  // Sharing
  copyPublicUrl: () => Promise<void>;
  shareViaWebApi: () => Promise<void>;
  
  // Analytics (future)
  viewCount: number;
  incrementViewCount: () => void;
}

interface PublishResult {
  success: boolean;
  publicUrl: string;
  slug: string;
  error?: string;
}

export function useItineraryPublish(
  itineraryId: string
): UseItineraryPublishReturn
```

**使用例**:
```tsx
function SharePanel() {
  const {
    isPublic,
    publicUrl,
    publish,
    unpublish,
    copyPublicUrl
  } = useItineraryPublish('itinerary-123');
  
  return (
    <div>
      {isPublic ? (
        <>
          <input value={publicUrl} readOnly />
          <button onClick={copyPublicUrl}>コピー</button>
          <button onClick={unpublish}>公開停止</button>
        </>
      ) : (
        <button onClick={() => publish({ isPublic: true })}>
          公開する
        </button>
      )}
    </div>
  );
}
```

---

### 5. `useItineraryPDF` - PDF生成ロジック

**目的**: PDF生成処理とプログレス管理をカプセル化

**ファイルパス**: `lib/hooks/itinerary/useItineraryPDF.ts`

```typescript
interface UseItineraryPDFOptions {
  quality?: number;
  margin?: number;
  format?: 'a4' | 'letter';
}

interface UseItineraryPDFReturn {
  // State
  isGenerating: boolean;
  progress: number; // 0-100
  error: Error | null;
  
  // Operations
  generatePDF: (itinerary: ItineraryData) => Promise<PDFResult>;
  openPreview: () => void;
  closePreview: () => void;
  
  // Preview state
  showPreview: boolean;
  previewUrl: string | null;
}

interface PDFResult {
  success: boolean;
  filename: string;
  blob?: Blob;
  error?: string;
}

export function useItineraryPDF(
  options?: UseItineraryPDFOptions
): UseItineraryPDFReturn
```

**使用例**:
```tsx
function PDFExporter({ itinerary }: { itinerary: ItineraryData }) {
  const {
    isGenerating,
    progress,
    generatePDF,
    openPreview
  } = useItineraryPDF({ quality: 0.95 });
  
  return (
    <div>
      <button onClick={openPreview}>プレビュー</button>
      <button 
        onClick={() => generatePDF(itinerary)} 
        disabled={isGenerating}
      >
        {isGenerating ? `生成中... ${progress}%` : 'PDF出力'}
      </button>
    </div>
  );
}
```

---

### 6. `useItineraryList` - 一覧取得・フィルター

**目的**: しおり一覧の取得、フィルタリング、ソート処理をカプセル化

**ファイルパス**: `lib/hooks/itinerary/useItineraryList.ts`

```typescript
interface UseItineraryListOptions {
  initialFilter?: ItineraryFilter;
  initialSort?: ItinerarySort;
  pageSize?: number;
}

interface UseItineraryListReturn {
  // Data
  itineraries: ItineraryListItem[];
  totalCount: number;
  
  // Loading state
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  
  // Filter & Sort
  filter: ItineraryFilter;
  sort: ItinerarySort;
  setFilter: (filter: ItineraryFilter) => void;
  setSort: (sort: ItinerarySort) => void;
  resetFilters: () => void;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  
  // Operations
  refresh: () => Promise<void>;
  deleteItinerary: (id: string) => Promise<void>;
}

export function useItineraryList(
  options?: UseItineraryListOptions
): UseItineraryListReturn
```

**使用例**:
```tsx
function ItinerariesPage() {
  const {
    itineraries,
    isLoading,
    filter,
    setFilter,
    sort,
    setSort,
    deleteItinerary
  } = useItineraryList({
    pageSize: 20,
    initialSort: { field: 'updatedAt', order: 'desc' }
  });
  
  return (
    <div>
      <ItineraryFilters filter={filter} onChange={setFilter} />
      <ItinerarySortMenu sort={sort} onChange={setSort} />
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <ItineraryList 
          items={itineraries} 
          onDelete={deleteItinerary} 
        />
      )}
    </div>
  );
}
```

---

### 7. `useItineraryHistory` - Undo/Redo管理

**目的**: 履歴管理とUndo/Redo操作をカプセル化

**ファイルパス**: `lib/hooks/itinerary/useItineraryHistory.ts`

```typescript
interface UseItineraryHistoryReturn {
  // State
  canUndo: boolean;
  canRedo: boolean;
  historySize: number;
  
  // Operations
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  
  // Advanced
  getHistoryAt: (index: number) => ItineraryData | null;
  jumpToHistory: (index: number) => void;
}

export function useItineraryHistory(): UseItineraryHistoryReturn
```

**使用例**:
```tsx
function HistoryControls() {
  const { undo, redo, canUndo, canRedo } = useItineraryHistory();
  
  return (
    <div>
      <button onClick={undo} disabled={!canUndo}>
        元に戻す
      </button>
      <button onClick={redo} disabled={!canRedo}>
        やり直す
      </button>
    </div>
  );
}
```

---

## 既存の地図関連Hooks

### `useGoogleMapsLoader`
**ファイルパス**: `lib/hooks/useGoogleMapsLoader.ts`

```typescript
interface UseGoogleMapsLoaderReturn {
  isLoaded: boolean;
  error: string | null;
}

export function useGoogleMapsLoader(): UseGoogleMapsLoaderReturn
```

### `useMapInstance`
**ファイルパス**: `lib/hooks/useMapInstance.ts`

```typescript
export function useMapInstance(
  mapRef: RefObject<HTMLDivElement>,
  isLoaded: boolean,
  center: { lat: number; lng: number },
  zoom: number
): google.maps.Map | null
```

### `useMapMarkers`
**ファイルパス**: `lib/hooks/useMapMarkers.ts`

```typescript
interface UseMapMarkersOptions {
  map: google.maps.Map | null;
  markerData: MarkerData[];
  numberingMode?: 'global' | 'perDay';
  showDay?: boolean;
}

export function useMapMarkers(options: UseMapMarkersOptions): void
```

### `useMapRoute`
**ファイルパス**: `lib/hooks/useMapRoute.ts`

```typescript
export function useMapRoute(
  map: google.maps.Map | null,
  spots: TouristSpot[],
  enabled: boolean
): void
```

---

## まとめ

### 提案するHooks
- **7個**の新しいカスタムHooks
- **4個**の既存地図関連Hooks

### 期待効果
1. ✅ ロジックとUIの分離
2. ✅ 再利用性の向上
3. ✅ テストの容易性
4. ✅ コンポーネントのシンプル化

---

**最終更新日**: 2025-01-10

