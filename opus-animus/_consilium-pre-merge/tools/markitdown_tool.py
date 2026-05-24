from markitdown import MarkItDown

_md = MarkItDown()


def convert_url(url: str) -> str:
    try:
        return _md.convert_url(url).text_content
    except Exception as e:
        return f"[markitdown] Failed to convert URL: {e}"


def convert_file(path: str) -> str:
    try:
        return _md.convert(path).text_content
    except Exception as e:
        return f"[markitdown] Failed to convert file: {e}"
