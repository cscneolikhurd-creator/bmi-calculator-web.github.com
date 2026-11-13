import glob

INJECTION = '''
<!-- Favicon & PWA -->
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#0d6efd">

<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:site_name" content="HealthCalc">
<meta property="og:image" content="https://healthcalc.in/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://healthcalc.in/og-image.png">
'''

SKIP = ["404.html"]

for f in glob.glob("*.html"):
    if f in SKIP:
        continue
    content = open(f, encoding="utf-8").read()
    if "manifest.json" in content:
        print(f"SKIP {f} — already injected")
        continue
    if "</head>" in content:
        content = content.replace("</head>", INJECTION + "\n</head>", 1)
        open(f, "w", encoding="utf-8").write(content)
        print(f"✅ OK {f}")
    else:
        print(f"⚠️  {f} — no </head> found")
