#!/bin/bash
# Footer: subscribe with MOBILE NUMBER instead of email.
# Run from the praveka-store folder:  bash apply-mobile.sh
set -e
[ -f server.js ] && [ -f public/index.html ] || { echo "Run this inside the praveka-store folder."; exit 1; }
grep -q 'name="phone" type="tel"' public/index.html && { echo "Already applied. Nothing to do."; exit 0; }
grep -q 'class="pf"' public/index.html || { echo "Apply the footer first: bash apply-footer.sh"; exit 1; }

for f in public/index.html public/script.js public/admin.html server.js; do cp "$f" "$f.bak2"; done

python3 - <<'PY'
def sub(path, old, new):
    s = open(path, encoding='utf-8').read()
    if s.count(old) != 1:
        raise SystemExit("Could not find the expected text in %s:\n  %s" % (path, old[:80]))
    open(path, 'w', encoding='utf-8').write(s.replace(old, new))
    print("updated", path)

# 1. Footer form: mobile number field
sub('public/index.html',
 '<input name="email" type="email" required placeholder="Your email" aria-label="Email address">',
 '<input name="phone" type="tel" inputmode="numeric" autocomplete="tel" maxlength="14" required placeholder="Your mobile number" aria-label="Mobile number">')
sub('public/index.html',
 'Get farming tips and offers by email.',
 'Get farming tips and offers on your mobile.')

# 2. Browser code: send the phone number
sub('public/script.js',
 'post("/api/subscribe",{email:f.elements.email.value})',
 'post("/api/subscribe",{phone:f.elements.phone.value})')

# 3. Server: validate a 10-digit Indian mobile number and save it
sub('server.js',
 'const email=s(q.body.email,120).toLowerCase();if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email))throw "Enter a valid email address";',
 'let phone=s(q.body.phone,20).replace(/\\D/g,"");if(phone.length===12&&phone.startsWith("91"))phone=phone.slice(2);if(!/^[6-9]\\d{9}$/.test(phone))throw "Enter a valid 10-digit mobile number";')
sub('server.js',
 'if(!L.some(x=>x.email===email)){L.unshift({date:new Date().toISOString(),email});wr("subscribers",L)}',
 'if(!L.some(x=>x.phone===phone)){L.unshift({date:new Date().toISOString(),phone});wr("subscribers",L)}')

# 4. Admin page: show phone (old email subscribers still display)
sub('public/admin.html',
 'esc(m.email)',
 'esc(m.phone||m.email)')
PY

echo "Done. Stop the server (Ctrl+C), run: npm start   then hard refresh (Cmd+Shift+R)."
