#!/bin/bash
# Script to organize model files into subdirectories by model name
# For Ferrari, Lamborghini, and Porsche

MODELS_DIR="/Users/mahe/Github/Perso/guess-the-model/public/models"

organize_brand() {
    local brand_dir="$1"
    echo "=== Organizing $brand_dir ==="
    
    cd "$brand_dir" || return
    
    for file in *.glb; do
        [ -f "$file" ] || continue
        
        # Extract model name from filename
        # Filename pattern: YEAR_brand_model_variant.glb or prefix_YEAR_brand_model.glb
        # We want to group by the core model name
        
        local model=""
        local lower_file=$(echo "$file" | tr '[:upper:]' '[:lower:]')
        
        case "$brand_dir" in
            *ferrari*)
                # Extract Ferrari model names
                if echo "$lower_file" | grep -q "250_gto"; then model="250_GTO"
                elif echo "$lower_file" | grep -q "testarossa\|849_testarossa"; then model="Testarossa"
                elif echo "$lower_file" | grep -q "f40"; then model="F40"
                elif echo "$lower_file" | grep -q "348"; then model="348"
                elif echo "$lower_file" | grep -q "512_tr"; then model="512_TR"
                elif echo "$lower_file" | grep -q "f50"; then model="F50"
                elif echo "$lower_file" | grep -q "360_modena"; then model="360_Modena"
                elif echo "$lower_file" | grep -q "enzo"; then model="Enzo"
                elif echo "$lower_file" | grep -q "612_scaglietti"; then model="612_Scaglietti"
                elif echo "$lower_file" | grep -q "f430\|430_scuderia"; then model="F430"
                elif echo "$lower_file" | grep -q "california"; then model="California"
                elif echo "$lower_file" | grep -q "fxx-k\|fxx_k"; then model="FXX-K"
                elif echo "$lower_file" | grep -q "fxx"; then model="FXX"
                elif echo "$lower_file" | grep -q "599xx"; then model="599XX"
                elif echo "$lower_file" | grep -q "599_gto\|599"; then model="599"
                elif echo "$lower_file" | grep -q "458"; then model="458"
                elif echo "$lower_file" | grep -q "ff"; then model="FF"
                elif echo "$lower_file" | grep -q "f12"; then model="F12"
                elif echo "$lower_file" | grep -q "laferrari"; then model="LaFerrari"
                elif echo "$lower_file" | grep -q "488"; then model="488"
                elif echo "$lower_file" | grep -q "gtc4_lusso"; then model="GTC4_Lusso"
                elif echo "$lower_file" | grep -q "j50"; then model="J50"
                elif echo "$lower_file" | grep -q "812"; then model="812"
                elif echo "$lower_file" | grep -q "portofino"; then model="Portofino"
                elif echo "$lower_file" | grep -q "sp38"; then model="SP38"
                elif echo "$lower_file" | grep -q "monza"; then model="Monza"
                elif echo "$lower_file" | grep -q "p80c"; then model="P80C"
                elif echo "$lower_file" | grep -q "f8"; then model="F8"
                elif echo "$lower_file" | grep -q "roma"; then model="Roma"
                elif echo "$lower_file" | grep -q "sf90"; then model="SF90"
                elif echo "$lower_file" | grep -q "296"; then model="296"
                elif echo "$lower_file" | grep -q "daytona_sp3"; then model="Daytona_SP3"
                elif echo "$lower_file" | grep -q "purosangue"; then model="Purosangue"
                elif echo "$lower_file" | grep -q "12cilindri"; then model="12Cilindri"
                else model="Other"
                fi
                ;;
            *lamborghini*)
                # Extract Lamborghini model names
                if echo "$lower_file" | grep -q "miura"; then model="Miura"
                elif echo "$lower_file" | grep -q "countach"; then model="Countach"
                elif echo "$lower_file" | grep -q "diablo"; then model="Diablo"
                elif echo "$lower_file" | grep -q "murcielago\|murciélago"; then model="Murcielago"
                elif echo "$lower_file" | grep -q "gallardo"; then model="Gallardo"
                elif echo "$lower_file" | grep -q "reventon\|reventón"; then model="Reventon"
                elif echo "$lower_file" | grep -q "estoque"; then model="Estoque"
                elif echo "$lower_file" | grep -q "aventador"; then model="Aventador"
                elif echo "$lower_file" | grep -q "sesto_elemento"; then model="Sesto_Elemento"
                elif echo "$lower_file" | grep -q "egoista"; then model="Egoista"
                elif echo "$lower_file" | grep -q "veneno"; then model="Veneno"
                elif echo "$lower_file" | grep -q "asterion"; then model="Asterion"
                elif echo "$lower_file" | grep -q "huracan\|huracán"; then model="Huracan"
                elif echo "$lower_file" | grep -q "centenario"; then model="Centenario"
                elif echo "$lower_file" | grep -q "urus"; then model="Urus"
                elif echo "$lower_file" | grep -q "sc20"; then model="SC20"
                elif echo "$lower_file" | grep -q "sian\|sián"; then model="Sian"
                elif echo "$lower_file" | grep -q "sc63"; then model="SC63"
                elif echo "$lower_file" | grep -q "invencible"; then model="Invencible"
                elif echo "$lower_file" | grep -q "lanzador"; then model="Lanzador"
                else model="Other"
                fi
                ;;
            *porsche*)
                # Extract Porsche model names
                if echo "$lower_file" | grep -q "918"; then model="918_Spyder"
                elif echo "$lower_file" | grep -q "935"; then model="935"
                elif echo "$lower_file" | grep -q "959"; then model="959"
                elif echo "$lower_file" | grep -q "963"; then model="963"
                elif echo "$lower_file" | grep -q "carrera_gt"; then model="Carrera_GT"
                elif echo "$lower_file" | grep -q "cayenne"; then model="Cayenne"
                elif echo "$lower_file" | grep -q "boxster\|718_boxster\|718_spyder"; then model="718_Boxster_Spyder"
                elif echo "$lower_file" | grep -q "718_cayman\|cayman"; then model="718_Cayman"
                elif echo "$lower_file" | grep -q "macan"; then model="Macan"
                elif echo "$lower_file" | grep -q "panamera"; then model="Panamera"
                elif echo "$lower_file" | grep -q "taycan"; then model="Taycan"
                elif echo "$lower_file" | grep -q "mission_r"; then model="Mission_R"
                elif echo "$lower_file" | grep -q "911"; then model="911"
                else model="Other"
                fi
                ;;
        esac
        
        if [ -n "$model" ]; then
            mkdir -p "$model"
            echo "  Moving $file -> $model/"
            mv "$file" "$model/"
        fi
    done
}

# Also move MODELS.md to stay where it is (we skip it since we only match *.glb)

organize_brand "$MODELS_DIR/ferrari"
organize_brand "$MODELS_DIR/lamborghini"
organize_brand "$MODELS_DIR/porsche"

echo ""
echo "=== Done! ==="
echo ""

# Print summary
for brand in ferrari lamborghini porsche; do
    echo "--- $brand ---"
    for dir in "$MODELS_DIR/$brand"/*/; do
        if [ -d "$dir" ]; then
            count=$(find "$dir" -name "*.glb" | wc -l | tr -d ' ')
            echo "  $(basename "$dir"): $count model(s)"
        fi
    done
    echo ""
done
