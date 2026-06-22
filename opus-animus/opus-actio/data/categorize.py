"""Merchant categorization for credit-card transactions."""

import unicodedata


CATEGORY_KEYWORDS = (
    ("transport", ("ICOCA", "ＩＣＯＣＡ", "JR", "ＪＲ", "エクスプレス", "タイムズカー", "ETC", "ＥＴＣ", "タクシー", "ﾀｸｼｰ", "GRAB")),
    ("bills", ("電力", "電気", "水道", "ガス", "カイジヨウ", "海上", "保険", "NHK")),
    ("subscription", ("APPLE COM", "OPENAI", "CHATGPT", "GOOGLE", "ﾚｼﾞｪﾝﾄﾞ", "レジェンド")),
    ("groceries", ("ｷﾞﾖｳﾑｽ", "業務", "ﾏﾝﾀﾞｲ", "万代", "ﾗｲﾌ", "ライフ", "ﾔﾏﾔ", "食品", "ﾏｰｹﾂﾄ", "マーケット", "ｽｰﾊﾟ")),
    ("dining", ("ｽﾞｼ", "寿司", "ﾏｸﾄﾞﾅﾙﾄﾞ", "マクドナルド", "ﾛｰｿﾝ", "ローソン", "ﾋﾞｽﾄﾛ", "ﾍﾞﾝﾄ", "弁当", "ｶﾌｪ", "珈琲")),
    ("health", ("薬局", "ﾔﾂｷﾖｸ", "病院", "ｸﾘﾆﾂｸ", "クリニック")),
    ("travel", ("TRIP.COM", "ﾌﾞｯｷﾝｸﾞ", "ブッキング", "BOOKING", "ﾎﾃﾙ", "ホテル", "航空", "ﾗﾄﾞｶﾝ")),
    ("shopping", ("ﾒﾙｶﾘ", "メルカリ", "ﾄﾞﾝｷ", "ドンキ", "ﾑｼﾞﾙｼ", "無印", "ﾏﾙﾁﾒﾃﾞｲｱ", "ﾖﾄﾞﾊﾞｼ", "ｱﾐｼﾞﾏ")),
    ("services", ("ﾍｱ", "ヘア", "SQ*", "ｶｽﾀﾑ")),
    ("entertainment", ("ｶﾗｵｹ", "映画", "ｹﾞｰﾑ", "ゲーム")),
)

CATEGORIES = tuple(category for category, _ in CATEGORY_KEYWORDS) + ("other",)


def _variants(value: str) -> tuple[str, str]:
    raw = value.casefold()
    normalized = unicodedata.normalize("NFKC", value).casefold()
    return raw, normalized


def categorize(merchant: str) -> str:
    """Return the first matching spending category for a merchant name."""
    merchant = merchant or ""
    merchant_raw, merchant_normalized = _variants(merchant)

    for category, keywords in CATEGORY_KEYWORDS:
        for keyword in keywords:
            keyword_raw, keyword_normalized = _variants(keyword)
            if keyword_raw in merchant_raw or keyword_normalized in merchant_normalized:
                return category

    return "other"
