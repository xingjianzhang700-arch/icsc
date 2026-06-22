#!/bin/bash
set -e
cd /home/user/icsc/output
FONT=/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc
TXT=txt2
SLIDES=slides

alpha() { # S FI E FO
python3 -c "
S,FI,E,FO=$1,$2,$3,$4
print(f'if(lt(t,{S}),0,if(lt(t,{S+FI}),(t-{S})/{FI},if(lt(t,{E-FO}),1,if(lt(t,{E}),({E}-t)/{FO},0))))')"
}

# ---- category slide generator ----
# args: outname label_file title_file name_file duration
make_category() {
  OUT=$1; LBL=$2; TITLE=$3; NAME=$4; DUR=$5
  A_LBL=$(alpha 0.0 0.3 $DUR 0.3)
  A_TITLE=$(alpha 0.15 0.4 $DUR 0.3)
  A_NAME=$(alpha 0.5 0.4 $DUR 0.3)
  BARW="min(360,(t-0.15)*900)"
  FILTER="color=c=0x1c140d:s=1920x1080:d=$DUR:r=30,vignette=PI/5[bg];"
  FILTER+="[bg]drawtext=fontfile=$FONT:textfile=$TXT/$LBL:fontsize=30:fontcolor=0xb89a6a:x=(w-text_w)/2:y=360:alpha='$A_LBL'[v1];"
  FILTER+="[v1]drawtext=fontfile=$FONT:textfile=$TXT/$TITLE:fontsize=110:fontcolor=0xf0d8a8:x=(w-text_w)/2:y=420:alpha='$A_TITLE'[v2];"
  FILTER+="[v2]drawbox=x='(iw-${BARW})/2':y=580:w='if(lt(t,0.15),0,${BARW})':h=6:color=0xf0d8a8@1.0:t=fill[v3];"
  FILTER+="[v3]drawtext=fontfile=$FONT:textfile=$TXT/$NAME:fontsize=52:fontcolor=white:x=(w-text_w)/2:y=620:alpha='$A_NAME'[vout]"
  ffmpeg -y -filter_complex "$FILTER" -map "[vout]" -t $DUR -r 30 -pix_fmt yuv420p -c:v libx264 -crf 18 "$SLIDES/$OUT" -loglevel error
}

make_category slide1.mp4 lbl_instr.txt t1.txt n1.txt 2.5
make_category slide2.mp4 lbl_instr.txt t2.txt n2.txt 2.5
make_category slide3.mp4 lbl_instr.txt t3.txt n3.txt 2.5
make_category slide4.mp4 lbl_instr.txt t4.txt n4.txt 2.5
make_category slide5.mp4 lbl_make.txt  t5.txt n5.txt 2.5

# ---- thank-you slide ----
DUR=7.5
A_TH=$(alpha 0.0 0.4 $DUR 0.5)
A_B1=$(alpha 0.6 0.4 $DUR 0.5)
A_B2=$(alpha 0.9 0.4 $DUR 0.5)
A_B3=$(alpha 1.2 0.4 $DUR 0.5)
A_B4=$(alpha 1.5 0.4 $DUR 0.5)
BARW="min(300,t*900)"
FILTER="color=c=0x1c140d:s=1920x1080:d=$DUR:r=30,vignette=PI/5[bg];"
FILTER+="[bg]drawtext=fontfile=$FONT:textfile=$TXT/thtitle.txt:fontsize=68:fontcolor=0xf0d8a8:x=(w-text_w)/2:y=300:alpha='$A_TH'[v1];"
FILTER+="[v1]drawbox=x='(iw-${BARW})/2':y=400:w='${BARW}':h=5:color=0xf0d8a8@1.0:t=fill[v2];"
FILTER+="[v2]drawtext=fontfile=$FONT:textfile=$TXT/b1.txt:fontsize=40:fontcolor=white:x=(w-text_w)/2:y=480:alpha='$A_B1'[v3];"
FILTER+="[v3]drawtext=fontfile=$FONT:textfile=$TXT/b2.txt:fontsize=40:fontcolor=white:x=(w-text_w)/2:y=550:alpha='$A_B2'[v4];"
FILTER+="[v4]drawtext=fontfile=$FONT:textfile=$TXT/b3.txt:fontsize=40:fontcolor=white:x=(w-text_w)/2:y=620:alpha='$A_B3'[v5];"
FILTER+="[v5]drawtext=fontfile=$FONT:textfile=$TXT/b4.txt:fontsize=40:fontcolor=white:x=(w-text_w)/2:y=690:alpha='$A_B4'[vout]"
ffmpeg -y -filter_complex "$FILTER" -map "[vout]" -t $DUR -r 30 -pix_fmt yuv420p -c:v libx264 -crf 18 "$SLIDES/slide6.mp4" -loglevel error

echo "done"
