import sys
for f in ['assets/js/views.js','assets/js/app.js','assets/js/storage.js','assets/js/plan.js']:
    src = open(f, encoding='utf-8').read()
    stack = []
    pairs = {')':'(',']':'[','}':'{'}
    in_str=None; esc=False; in_line=False; in_block=False
    i=0
    bad=False
    while i<len(src):
        c=src[i]
        if in_line:
            if c=='\n': in_line=False
            i+=1; continue
        if in_block:
            if c=='*' and i+1<len(src) and src[i+1]=='/': in_block=False; i+=2; continue
            i+=1; continue
        if in_str:
            if esc: esc=False
            elif c=='\\': esc=True
            elif c==in_str: in_str=None
            i+=1; continue
        if c=='/' and i+1<len(src) and src[i+1]=='/': in_line=True; i+=2; continue
        if c=='/' and i+1<len(src) and src[i+1]=='*': in_block=True; i+=2; continue
        if c in ('"',"'",'`'): in_str=c; i+=1; continue
        if c in '([{': stack.append((c,i))
        elif c in ')]}':
            if not stack or stack[-1][0]!=pairs[c]:
                line = src[:i].count('\n')+1
                print(f,'MISMATCH line',line,'char',c); bad=True; break
            stack.pop()
        i+=1
    if not bad:
        if stack:
            c,i=stack[-1]
            line = src[:i].count('\n')+1
            print(f,'UNCLOSED',c,'line',line)
        else:
            print(f,'OK')
