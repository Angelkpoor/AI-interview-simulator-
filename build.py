import re
h=open('index.html').read()
h=h.replace('<link rel="stylesheet" href="src/styles.css">','<style>'+open('src/styles.css').read()+'</style>')
h=re.sub(r'<script src="(src/[^"]+)"></script>',lambda m:'<script>'+open(m.group(1)).read()+'</script>',h)
import os; os.makedirs('dist',exist_ok=True); open('dist/interview-ai.html','w').write(h); print(len(h))
