#!/bin/bash
# *GH* selected major languages for space and time
LOCALES="de_DE fr_FR it_IT es_ES en_GB nl_NL sv_SE pl_PL fr_BE nl_BE de_AT da_DK fi_FI el_GR en_IE pt_PT cs_CZ hu_HU ro_RO bg_BG ja_JP zh_CN ko_KR hi_IN ru_RU"

echo "Installing languages"
apt-get update
apt-get install -y \
    locales locales-all
for LOCALE in ${LOCALES}; do
    echo "Generating Locale for ${LOCALE}"
    localedef -i ${LOCALE} -f UTF-8 ${LOCALE}.UTF-8
done