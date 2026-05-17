import json
import re


class LucidaPitchEngine:
    _ROMAJI_ONSET = re.compile(
        r"^((?:[kgnhbpmr]y|sh|ch|ts|[bcdfghjklmnpqrstvwxyz])?)([aeiou])"
    )

    def __init__(self, rule_file_path="lucida_pitch_rules.json"):
        with open(rule_file_path, "r", encoding="utf-8") as f:
            self.config = json.load(f)

        self.vietnamese_tones = {
            "a": {"huyền": "à", "sắc": "á", "ngang": "a"},
            "i": {"huyền": "ì", "sắc": "í", "ngang": "i"},
            "u": {"huyền": "ù", "sắc": "ú", "ngang": "u"},
            "e": {"huyền": "è", "sắc": "é", "ngang": "e"},
            "o": {"huyền": "ò", "sắc": "ó", "ngang": "o"},
            "ê": {"huyền": "ề", "sắc": "ế", "ngang": "ê"},
            "ô": {"huyền": "ồ", "sắc": "ố", "ngang": "ô"},
            "ư": {"huyền": "ừ", "sắc": "ứ", "ngang": "ư"},
        }

    def split_into_moras(self, word: str) -> list[str]:
        moras = []
        i = 0
        word = word.lower()
        while i < len(word):
            # Syllabic n is its own mora before consonants and at word end.
            if word[i] == "n":
                next_ch = word[i + 1] if i + 1 < len(word) else ""
                if not next_ch or next_ch not in "aeiouy":
                    moras.append("n")
                    i += 1
                    continue

            # Fold sokuon-like doubled consonants into the next consonant mora.
            if (
                i < len(word) - 1
                and word[i] == word[i + 1]
                and word[i] not in "aeioun"
            ):
                i += 1
                continue

            if i < len(word) - 1:
                pair = word[i : i + 2]
                if pair in self.config["mora_processor"]["long_vowels"]:
                    moras.extend(self.config["mora_processor"]["long_vowels"][pair])
                    i += 2
                    continue
                if pair in self.config["mora_processor"]["diphthongs"]:
                    moras.extend(self.config["mora_processor"]["diphthongs"][pair])
                    i += 2
                    continue
            match = self._ROMAJI_ONSET.match(word[i:])
            if match:
                moras.append(match.group(0))
                i += len(match.group(0))
            else:
                moras.append(word[i])
                i += 1
        return moras

    def _heiban(self, n: int) -> list[str]:
        profile = ["H"] * n
        if n > 0:
            profile[0] = "L"
        return profile

    def apply_pitch_profile(self, moras: list[str], root_type: str, suffix: str) -> list[str]:
        pitch_profile = self._heiban(len(moras))

        # --- Conjugation rules (動詞/形容詞) ---
        rule = self.config["conjugation_rules"].get(suffix, {}).get(root_type)
        if rule:
            action = rule["action"]
            if action == "apply_heiban_pattern":
                return pitch_profile
            if action == "set_peak_at_target":
                target = rule["target_mora"]
                for idx, mora in enumerate(moras):
                    if mora == target:
                        pitch_profile[idx] = "P"
                        for j in range(idx + 1, len(moras)):
                            pitch_profile[j] = "L"
                        break
                return pitch_profile
            if action == "set_peak_before_suffix":
                target = rule["suffix_start"]
                for idx, mora in enumerate(moras):
                    if mora == target:
                        if idx > 0:
                            pitch_profile[idx - 1] = "P"
                        for j in range(idx, len(moras)):
                            pitch_profile[j] = "L"
                        break
            return pitch_profile

        # --- Suffix grammar rules (N2/N3) ---
        suffix_rules = self.config["suffix_grammar_rules"]

        if suffix in suffix_rules["deaccenting_group"]["suffixes"]:
            return pitch_profile  # Heiban already

        if suffix in suffix_rules["preaccenting_group"]["suffixes"]:
            suffix_start_idx = len(moras) - len(self.split_into_moras(suffix))
            target_idx = suffix_start_idx - 1
            if target_idx >= 0:
                pitch_profile[target_idx] = "P"
            for j in range(target_idx + 1, len(moras)):
                pitch_profile[j] = "L"
            return pitch_profile

        for dom_rule in suffix_rules["dominant_group"]["rules"]:
            if suffix == dom_rule["suffix"]:
                suffix_start_idx = len(moras) - len(self.split_into_moras(suffix))
                peak_idx = suffix_start_idx + dom_rule["peak_index"]
                if 0 <= peak_idx < len(moras):
                    pitch_profile[peak_idx] = "P"
                for j in range(peak_idx + 1, len(moras)):
                    pitch_profile[j] = "L"
                return pitch_profile

        return pitch_profile

    def _known_suffixes(self) -> list[str]:
        suffix_rules = self.config["suffix_grammar_rules"]
        suffixes = set(self.config["conjugation_rules"].keys())
        suffixes.update(suffix_rules["deaccenting_group"]["suffixes"])
        suffixes.update(suffix_rules["preaccenting_group"]["suffixes"])
        suffixes.update(suffix_rules["phrasal_reset_group"]["suffixes"])
        suffixes.update(rule["suffix"] for rule in suffix_rules["dominant_group"]["rules"])
        return sorted(suffixes, key=len, reverse=True)

    def _infer_suffix(self, word: str) -> str:
        for suffix in self._known_suffixes():
            if word.endswith(suffix) and len(word) > len(suffix):
                return suffix
        return ""

    def _process_romaji_word(self, word: str, root_type: str) -> str:
        clean = word.lower().replace("-", "").replace("'", "")
        moras = self.split_into_moras(clean)
        if not moras:
            return word

        suffix = self._infer_suffix(clean)
        if suffix:
            pitch_profile = self.apply_pitch_profile(moras, root_type, suffix)
        else:
            pitch_profile = self._heiban(len(moras))
        return self.apply_vietnamese_tones(moras, pitch_profile)

    # Vietnamese toned/circumflex → ASCII base vowel
    _VI_BASE: dict[str, str] = {
        c: base
        for base, chars in {
            "a": "àáạảãăắặẳẵằâấậẩẫ",
            "e": "èéẹẻẽêềếệểễ",
            "i": "ìíịỉĩ",
            "o": "òóọỏõôồốộổỗ",
            "u": "ùúụủũưừứựửữ",
        }.items()
        for c in chars
    }

    @staticmethod
    def _end_vowel(mora: str) -> str:
        """Return ASCII base of the last vowel in a V-Romaji mora."""
        for ch in reversed(mora):
            base = LucidaPitchEngine._VI_BASE.get(ch, ch)
            if base in "aeiou":
                return base
        return ""

    def apply_vietnamese_tones(self, moras: list[str], pitch_profile: list[str]) -> str:
        assimilation = self.config["mora_processor"].get("vowel_assimilation", {})
        result = []
        vowels = "aeiouêôư"
        prev_v_mora = ""

        for mora, pitch in zip(moras, pitch_profile):
            # Standalone single vowel: assimilate to previous mora's end vowel
            if mora in assimilation and len(mora) == 1:
                prev_end = self._end_vowel(prev_v_mora)
                rule = assimilation[mora]
                mora = rule.get(prev_end, rule.get("default", mora))

            v_mora = self.config["v_romaji_orthography"]["mapping"].get(mora, mora)
            tone = self.config["pitch_to_tone_mapping"][pitch]
            if tone != "ngang":
                for j in range(len(v_mora) - 1, -1, -1):
                    if v_mora[j] in vowels:
                        toned = self.vietnamese_tones[v_mora[j]][tone]
                        v_mora = v_mora[:j] + toned + v_mora[j + 1 :]
                        break
            result.append(v_mora)
            prev_v_mora = v_mora

        return " ".join(result)

    def process_romaji(self, romaji: str, root_type: str = "kifuku") -> str:
        """Convert raw romaji to V-Romaji.

        Scanner/router input usually has no explicit morphology, so this keeps a
        heiban fallback but now applies configured suffix rules when the ending
        is unambiguous.
        """
        parts = re.split(r"([A-Za-z][A-Za-z'-]*)", romaji)
        converted = [
            self._process_romaji_word(part, root_type) if re.fullmatch(r"[A-Za-z][A-Za-z'-]*", part) else part
            for part in parts
        ]
        return "".join(converted)

    def process(self, root_word: str, suffix: str, root_type: str = "kifuku") -> dict:
        full_word = root_word + suffix
        moras = self.split_into_moras(full_word)
        pitch_profile = self.apply_pitch_profile(moras, root_type, suffix)
        v_romaji = self.apply_vietnamese_tones(moras, pitch_profile)
        return {
            "word": full_word,
            "moras": moras,
            "pitch_profile": pitch_profile,
            "v_romaji": v_romaji,
        }
