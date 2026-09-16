cat << 'EOF' > .claude/skills/db-types.sh
#!/usr/bin/env bash
npx supabase gen types typescript --local > src/types/supabase.ts
