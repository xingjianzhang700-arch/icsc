#!/bin/bash
set -e
cd /home/user/icsc/output
FONT=/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc
TXT=txt2
DUR=7.5

alpha() { # S FI E FO
python3 -c "
S,FI,E,FO=$1,$2,$3,$4
print(f'if(lt(t,{S}),0,if(lt(t,{S+FI}),(t-{S})/{FI},if(lt(t,{E-FO}),1,if(lt(t,{E}),({E}-t)/{FO},0))))')"
}

A_TH=$(alpha 0.0 0.4 $DUR 0.5)
A_B1=$(alpha 0.6 0.4 $DUR 0.5)
A_B2=$(alpha 0.9 0.4 $DUR 0.5)
A_B3=$(alpha 1.2 0.4 $DUR 0.5)
A_B4=$(alpha 1.5 0.4 $DUR 0.5)
BARW="min(300,t*900)"

# firefly drift params: x0 amp freq phase ystart yend
FIREFLIES=(
  "260 18 0.50 0.0 1150 -80"
  "560 22 0.42 1.1 1220 -60"
  "880 16 0.55 2.0 1100 -100"
  "1180 24 0.46 0.6 1250 -50"
  "1480 19 0.52 2.6 1160 -90"
  "1700 21 0.40 1.6 1230 -70"
  "420 15 0.60 3.0 1300 -40"
  "1020 20 0.48 0.3 1190 -85"
)

FILTER="[0:v]scale=1920:1080,format=rgba[bg];"
FILTER+="[2:v]format=rgba[bigglow];"
FILTER+="[bg][bigglow]overlay=x=(W-w)/2:y=120:format=auto[base];"

PREV="base"
IDX=1
for f in "${FIREFLIES[@]}"; do
  read X0 AMP FREQ PHASE YS YE <<< "$f"
  XEXPR="${X0}+${AMP}*sin(${FREQ}*t+${PHASE})"
  YEXPR="${YS}-(${YS}-(${YE}))*(t/${DUR})"
  NEXT="p${IDX}"
  FILTER+="[${PREV}][1:v]overlay=x='${XEXPR}':y='${YEXPR}':format=auto[${NEXT}];"
  PREV=$NEXT
  IDX=$((IDX+1))
done

FILTER+="[${PREV}]format=yuv420p[bgfinal];"
FILTER+="[bgfinal]drawtext=fontfile=$FONT:textfile=$TXT/thtitle.txt:fontsize=68:fontcolor=0xfff0d8:x=(w-text_w)/2:y=300:alpha='$A_TH'[v1];"
FILTER+="[v1]drawbox=x='(iw-${BARW})/2':y=400:w='${BARW}':h=5:color=0xf0d8a8@1.0:t=fill[v2];"
FILTER+="[v2]drawtext=fontfile=$FONT:textfile=$TXT/b1.txt:fontsize=40:fontcolor=white:x=(w-text_w)/2:y=480:alpha='$A_B1'[v3];"
FILTER+="[v3]drawtext=fontfile=$FONT:textfile=$TXT/b2.txt:fontsize=40:fontcolor=white:x=(w-text_w)/2:y=550:alpha='$A_B2'[v4];"
FILTER+="[v4]drawtext=fontfile=$FONT:textfile=$TXT/b3.txt:fontsize=40:fontcolor=white:x=(w-text_w)/2:y=620:alpha='$A_B3'[v5];"
FILTER+="[v5]drawtext=fontfile=$FONT:textfile=$TXT/b4.txt:fontsize=40:fontcolor=white:x=(w-text_w)/2:y=690:alpha='$A_B4'[vout]"

ffmpeg -y \
  -loop 1 -i $TXT/bg_warm.png \
  -loop 1 -i $TXT/firefly.png \
  -loop 1 -i $TXT/bigglow.png \
  -filter_complex "$FILTER" -map "[vout]" -t $DUR -r 30 -pix_fmt yuv420p -c:v libx264 -crf 18 slides/slide6.mp4 -loglevel error

echo done
