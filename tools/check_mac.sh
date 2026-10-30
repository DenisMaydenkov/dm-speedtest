#!/usr/bin/env bash
# System-level privacy check for macOS. Read-only: changes nothing on your Mac.
# Usage: bash tools/check_mac.sh
ok()   { printf '  ✅ %s\n' "$1"; }
bad()  { printf '  ❌ %s\n' "$1"; }
info() { printf '  ℹ️  %s\n' "$1"; }
cc_of() { curl -s --max-time 8 "https://ipwho.is/$1" | sed -n 's/.*"country_code": *"\([A-Z]*\)".*/\1/p'; }
EAST='RU UA BY KZ'
is_east() { for c in $EAST; do [ "$1" = "$c" ] && return 0; done; return 1; }

echo "1. IPv4: что видят программы без прокси (Telegram, игры, терминал)"
v4=$(curl -s --max-time 8 https://api.ipify.org)
if [ -z "$v4" ]; then bad "нет ответа от api.ipify.org"; else
  c=$(cc_of "$v4"); info "IP $v4, страна: ${c:-?}"
  if [ -n "$c" ] && ! is_east "$c"; then ok "весь трафик идёт через VPN (TUN работает)"
  else bad "программы выходят напрямую с вашим реальным IP: включите TUN в Clash Verge"; fi
fi

echo "2. IPv6"
v6=$(curl -6 -s --max-time 6 https://api6.ipify.org)
if [ -z "$v6" ]; then ok "IPv6 наружу не используется"; else
  c=$(cc_of "$v6"); info "IPv6 $v6, страна: ${c:-?}"
  if [ -n "$c" ] && ! is_east "$c"; then ok "IPv6 идёт через VPN"; else bad "IPv6 может уходить мимо VPN: отключите IPv6 в сети или включите в туннеле"; fi
fi

echo "3. DNS-серверы системы"
ns=$(scutil --dns | awk '/nameserver\[[0-9]+\]/{print $3}' | sort -u)
if [ -z "$ns" ]; then info "не найдены"; else
  for n in $ns; do
    case "$n" in
      192.168.*|10.*|172.1[6-9].*|172.2[0-9].*|172.3[0-1].*) bad "$n (локальный адрес: скорее всего роутер и DNS провайдера)";;
      *) ok "$n";;
    esac
  done
fi

echo "4. Маршрут по умолчанию"
if=$(route -n get default 2>/dev/null | awk '/interface:/{print $2}')
case "$if" in
  utun*) ok "через туннель ($if)";;
  "")    info "не определён";;
  *)     bad "через $if: при включённом TUN основным обычно становится utun*";;
esac

echo "5. Язык, регион и часовой пояс системы"
loc=$(defaults read -g AppleLocale 2>/dev/null); lang=$(defaults read -g AppleLanguages 2>/dev/null | sed -n '2p' | tr -d ' ",')
tz=$(readlink /etc/localtime | sed 's|.*/zoneinfo/||')
info "локаль: $loc, язык: $lang, пояс: $tz"
case "$loc$lang" in *ru*|*uk*|*be*|*kk*) bad "в системе русский язык или регион";; *) ok "язык и регион не выдают";; esac
case "$tz" in Europe/Amsterdam|Europe/Brussels|Europe/Berlin|Europe/Paris) ok "часовой пояс подходит";; *) bad "часовой пояс $tz не совпадает с Нидерландами";; esac

echo; echo "Проверьте отдельно вручную: правила DIRECT для российских доменов в конфиге Clash и kill switch при обрыве VPN."
