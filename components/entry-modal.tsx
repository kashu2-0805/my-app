// components/entry-form.tsx の適切な場所（「誰と？」の項目の後など）に追加してください
// ※以下のコードを現在のフォームに追加するイメージです

<div className="space-y-3">
  <Label className="text-[13px] font-bold text-slate-400 uppercase tracking-widest leading-none">関係性カテゴリ</Label>
  <div className="flex flex-wrap gap-2">
    {['仕事', '友人', '家族', 'じぶん', 'その他'].map((rel) => (
      <button
        key={rel}
        type="button"
        onClick={() => setFormData({ ...formData, relationship: rel })}
        className={cn(
          "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
          formData.relationship === rel 
            ? "bg-indigo-600 text-white border-indigo-600 shadow-md" 
            : "bg-white text-slate-400 border-slate-100 hover:border-indigo-200"
        )}
      >
        {rel}
      </button>
    ))}
  </div>
</div>
