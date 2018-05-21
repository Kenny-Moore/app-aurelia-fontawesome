/* globals exports */
function Constants() { //jshint ignore : line
    //Common constants
    this.accepted_photos_index = "acceptedPhotosIdx";
    this.cache_threshold_number = 5;
    this.next_cache_size = 10;
    this.flickr_url = "https://api.flickr.com/services/rest/?method=flickr.groups.pools.getPhotos&api_key=3ae7651ec514a2d3550c3afbc962a733&group_id=2768627@N24&format=json&nojsoncallback=1&extras=owner_name,url_k,url_l,url_m,media&per_page=500&page=";
    this.tn_url = "https://search.yahoo.com/trending/us_general.json";
    this.tnFrCode = "yset_chr_syc_tn";
    this.bn_url = "https://s.yimg.com/os/fp_gondor_breaking_news/news_us_en-us.json";
    this.bnTimeLimit = 14400;
    this.befrugal_url = "http://www.befrugal.com/lp/yahoo";
    this.weather_url = "https://query.yahooapis.com/v1/public/yql?q=";
    this.weatherUI = false;
    this.tn_interval = 300000; //Trending Now stories will be updated every 5 mins
    this.tn_enable_value = "2";
    this.bn_interval = 600000; //Breaking news will be polled every 10 mins
    this.finance_interval = 1200000; //Finance stories will be updated every 20 minutes
    this.twoWeeks = 14*24*3600*1000;
    this.aWeek = 7*24*3600*1000;
    this.footerUpdatedStart = 1523289600000; //april 3rd 2018
    this.footerUpdatedEnd = 1543104000000; //november 25th 2018
    this.video_media = "video";
    this.ratio_min = 1.0;//1.4;
    this.ratio_max = 1.85;
    this.width5 = 1175;
    this.width4 = 920;
    this.width3 = 580;
    this.timeout_serverError = 1800000;
    this.timeout_ffOffline = 60000;
    this.uiContainerWidth = 360;
    this.uiContainerWithSearchProtectWidth = 420;
    this.topSitesRefreshTime = 3600000; //1 hour
    this.historyRefreshTime = 600000; //10 minutes
    this.titleStringLength = 18;
    this.ffTopSites = 20;
    this.tracker_page_info = "page_info";
    this.tracker_click_info = "click_info";
    this.tracker_link_view = "link_view";
    this.tracker_install = 'install';
    this.tracker_upgrade = 'upgrade';
    this.tracker_uninstall = 'uninstall';
    this.tracker_alive = 'live';
    this.tracker_search_modified = 'modified';
    this.tracker_alive_ping_interval = 28800000 ;// 8 hrs = 8 * 60 * 60 * 1000 milli sec.
    this.tracker_alive_ping_interval_we = 86400000;
    this.tracker_gpos_topsites = 1;
    this.tracker_gpos_search_protect_panel = 2;
    this.tracker_gpos_flickr = 3;
    this.tracker_gpos_feedback = 5;
    this.tracker_gpos_search_box = 4;
    this.tracker_flickrArea_p_owner = 1;
    this.tracker_flickrArea_p_flickrlogo =2;
    this.tracker_searchArea_p_search_box = 1;
    this.tracker_searchArea_p_search_suggestion = 2;
    this.tracker_feedbackArea_p_feedback = 1;
    this.tracker_topSitesArea_p_edit = 11;
    this.tracker_topSitesArea_p_done = 12;
    this.tracker_searchArea_slk_search_box = "newtab_search_box";
    this.tracker_searchArea_slk_search_suggestion = "newtab_search_suggestion";
    this.tracker_vtestid = "default";
    this.keycode_up = 38;
    this.keycode_down = 40;
    this.keycode_left = 37;
    this.keycode_right = 39;
    this.keycode_enter = 13;
    this.keycode_control = 17;
    this.keycode_command_l = 91;
    this.keycode_command_r = 93;
    this.keycode_delete = 8;
    this.suggestionDisplayCount = 6;
    this.suggestionSitesCount = 2;
    this.initialSuggestIndex = -1;
    this.tracker_browser_chr = "chr";
    this.tracker_browser_ff = "ff";
    this.tracker_browser_sf = "sf";
    this.maxBgPhotosStored = 50;
    this.splicePercent = 0.5;
    this.acceptedPhotosRemaining = 20;
    this.feedBackDistance = 24;
    this.rightToggleViewDistance = 25;
    this.iconToggleDistance = 4;
    this.iconsPerRow = 9;
    this.shortenStringLength = 25;
    this.isToolbar = "yahoo-newtab-toolbar";
    this.toolbarEdition = "toolbar";
    this.toolbarInstallDate = "yahoo-newtab-toolbar-install-date";
    this.distributionChannelPrefKey = "yahoo-newtab-distribution-channel";
    this.userSearchSetChoice = "yahoo-newtab-user-searchset";
    this.toolbarDistribution = "external-tb";
    this.breakingNewsFrCode = "yset_chr_newtab_brkg";

    this.distributionDefaultChannel = "external-oracle";
    this.contentEnhancerFF = false;
    this.distributionChannels = {
        "external-oracle": {
            "frCodeChrome": "yset_chr_syc_oracle",
            "frCodeFirefox": "yset_ff_syc_oracle",
            "partnerCode": "oracle",
            "chrome_space_id": 151340119,
            "firefox_space_id": 151340118,
            "searchType": "fr",
            "trendingNow": {
                "type": "orcl"
            },
            "breakingNewsFrCode": "yset_brkg_syc_oracle",
            "amp_desc_dist": "oracle"
        },
        "external-oracle-intl": {
            "frCodeChrome": "yset_chr_syc_oracle",
            "frCodeFirefox": "yset_ff_syc_oracle",
            "partnerCode": "oracle",
            "chrome_space_id": 151340119,
            "firefox_space_id": 151340118,
            "searchType": "fr",
            "breakingNewsFrCode": "yset_brkg_syc_oracle",
            "amp_desc_dist": "oracle"
        },
        "external-oracle-v1": {
            "frCodeChrome": "yset_chr_syc_oracle",
            "frCodeFirefox": "yset_ff_syc_oracle",
            "partnerCode": "oracle",
            "chrome_space_id": 151340119,
            "firefox_space_id": 151340118,
            "searchType": "fr",
            "trendingNow": {
                "type": "orcl"
            },
            "breakingNewsFrCode": "yset_brkg_syc_oracle",
            "amp_desc_dist": "oracle"
        },
        "external-bundled": {
            "hsimp": "yhs-009",
            "hspart": "mozilla",
            "frCodeChrome": "yset_chr_cnewtab",
            "frCodeFirefox": "yset_ff_hp_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "amp_desc_dist": "bundle"
        },
        "external-oo": {
            "hsimp": "yhs-102",
            "hspart": "mozilla",
            "frCodeChrome": "yset_chr_cnewtab",
            "frCodeFirefox": "yset_ff_hp_cnewtab",
            "frCodeSafari": "yset_sf_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "trendingNow": {
                "type": "ono"
            },
            "amp_desc_dist": "oo"
        },
        "external-finance": {
            "hsimp": "yhs-102",
            "hspart": "mozilla",
            "frCodeChrome": "yset_chr_cnewtab",
            "frCodeFirefox": "yset_ff_hp_cnewtab",
            "frCodeSafari": "yset_sf_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "typeParam": "fin",
            "typeDefault": "fin",
            "amp_desc_dist": "finance"
        },
        "external-oo-guide-dialog": {
            "hsimp": "yhs-102",
            "hspart": "mozilla",
            "frCodeChrome": "yset_chr_cnewtab",
            "frCodeFirefox": "yset_ff_hp_cnewtab",
            "frCodeSafari": "yset_sf_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "trendingNow": {
                "type": "ono"
            },
            "typeParam": "newtab_v2",
            "typeDefault": "default_v2",
            "amp_desc_dist": "oo-guide-dialog"
        },
        "external-oo-nosearch": {
            "hsimp": "yhs-102",
            "hspart": "mozilla",
            "frCodeChrome": "yset_chr_cnewtab2",
            "frCodeFirefox": "yset_ff_hp_cnewtab",
            "frCodeSafari": "yset_sf_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "amp_desc_dist": "oo-nosearch"
        },
        "external-oracle-befrugal": {
            "frCodeChrome": "yset_chr_syc_oracle",
            "frCodeFirefox": "yset_ff_syc_oracle",
            "partnerCode": "oracle",
            "chrome_space_id": 151340119,
            "firefox_space_id": 151340118,
            "searchType": "fr",
            "trendingNow": {
                "type": "orcl"
            },
            "breakingNewsFrCode": "yset_brkg_syc_oracle",
            "amp_desc_dist": "oracle-befrugal"
        },
        "external-tb": {
            "hsimp": "yhs-100",
            "hspart": "mozilla",
            "frCodeChrome": "yset_chr_cnewtab",
            "frCodeFirefox": "yset_ff_hp_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "trendingNow": {
                "type": "ono"
            },
            "amp_desc_dist": "tb"
        },
        "external-oo-win-installer": {
            "hsimp": "yhs-102",
            "hspart": "mozilla",
            "frCodeChrome": "yset_chr_syc_oo",
            "frCodeFirefox": "yset_ff_hp_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "trendingNow": {
                "type": "ono"
            },
            "amp_desc_dist": "win-installer"
        },
        "external-amo": {
            "hsimp": "yhs-102",
            "hspart": "mozilla",
            "frCodeChrome": "yset_chr_cnewtab",
            "frCodeFirefox": "yset_ff_hp_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "amp_desc_dist": "amo"
        },
        "external-medianet": {
            "hsimp": "yhs-001",
            "hspart": "mnet",
            "frCodeChrome": "yset_chr_cnewtab",
            "frCodeFirefox": "yset_ff_hp_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "hsimp",
            "amp_desc_dist": "medianet"
        },
        "external-ddc": {
            "hsimp": "yhs-domaindev_pdfonline",
            "hspart": "domaindev",
            "frCodeChrome": "yset_chr_cnewtab",
            "frCodeFirefox": "yset_ff_hp_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "hsimp",
            "amp_desc_dist": "ddc"
        },
        "external-comodo": {
            "hsimp": "yhs-ccs",
            "hspart": "comodo",
            "frCodeChrome": "yset_chr_cnewtab",
            "frCodeFirefox": "yset_ff_hp_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "hsimp",
            "amp_desc_dist": "comodo"
        },
        "external-adco": {
            "hsimp": "yhs-ambe_newtab_ff",
            "hspart": "ambe",
            "frCodeChrome": "amb_ext",
            "frCodeFirefox": "amb_ext",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "amp_desc_dist": "adco"
        },
        "external-marketing": {
            "frCodeChrome": "yset_win_extmktg",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "trendingNow": {
                "type": "ono"
            },
            "typeParam": "mrkt_newtab",
            "typeDefault": "mrkt_default",
            "amp_desc_dist": "marketing"
        },
        "external-mediafire": {
            "hsimp": "yhs-mdf_yep",
            "hspart": "mdf",
            "frCodeChrome": "yset_chr_cnewtab",
            "frCodeFirefox": "yset_ff_hp_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "hsimp",
            "trendingNow": {
                "type": "ono"
            },
            "amp_desc_dist": "mediafire"
        },
        "external-adssquared": {
            "hsimp": "yhs-dom_yep",
            "hspart": "dom",
            "frCodeChrome": "yset_chr_cnewtab",
            "frCodeFirefox": "yset_ff_hp_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "hsimp",
            "trendingNow": {
                "type": "ono"
            },
            "amp_desc_dist": "adssquared"
        },
        "external-ironsource": {
            "frCodeChrome": "chrf-iryus",
            "frCodeFirefox": "chrf-iryus",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "typeParam": "ypi_znlrm_00_00_chr",
            "typeDefault": "ypi_znlrm_00_00_chr",
            "amp_desc_dist": "ironsource"
        },
        "external-ironsource-chr": {
            "frCodeChrome": "chrf-iryus",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "typeParam": "ypi_znlrm_00_00_chr",
            "typeDefault": "ypi_znlrm_00_00_chr",
            "amp_desc_dist": "ironsource"
        },
        "external-ironsource-ff": {
            "frCodeFirefox": "chrf-iryus",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "typeParam": "ypi_znlrm_00_00_ff",
            "typeHomePage": "ypi_znlrm_00_00_ff",
            "typeDefault": "ypi_znlrm_00_00_ff",
            "amp_desc_dist": "ironsource"
        },
        "external-aztec": {
            "hsimp": "yhs-flickrnewtab",
            "hspart": "aztec",
            "frCodeChrome": "yset_chr_cnewtab",
            "frCodeFirefox": "yset_ff_hp_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "hsimp",
            "trendingNow": {
                "type": "ono"
            },
            "amp_desc_dist": "aztec"
        },
        "external-visicom": {
            "hsimp": "yhs-burnaware",
            "hspart": "visicom",
            "frCodeChrome": "yset_chr_cnewtab",
            "frCodeFirefox": "yset_ff_hp_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "hsimp",
            "trendingNow": {
                "type": "ono"
            },
            "amp_desc_dist": "visicom"
        },
        "external-bndl-week1": {
            "hsimp": "yhs-204",
            "hspart": "mozilla",
            "frCodeChrome": "mozcustwk1",
            "frCodeFirefox": "mozcustwk1",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "typeHomePage": "mozcustwk1",
            "amp_desc_dist": "bndl-week1",
            "hpYhsParam": "10011",
            "typeParam": "yhs-mozilla-204",
            "typeDefault": "yhs-mozilla-204"
        },
        "external-bndl-day8": {
            "hsimp": "yhs-224",
            "hspart": "mozilla",
            "frCodeChrome": "mozcustd8",
            "frCodeFirefox": "mozcustd8",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "typeHomePage": "mozcustd8",
            "amp_desc_dist": "bndl-day8",
            "hpYhsParam": "10013",
            "typeParam": "yhs-mozilla-224",
            "typeDefault": "yhs-mozilla-224"
        },
        "external-bndl-main": {
            "hsimp": "yhs-244",
            "hspart": "mozilla",
            "frCodeChrome": "mozcustmain",
            "frCodeFirefox": "mozcustmain",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "typeHomePage": "mozcustmain",
            "amp_desc_dist": "bndl-main",
            "hpYhsParam": "10015",
            "typeParam": "yhs-mozilla-244",
            "typeDefault": "yhs-mozilla-244"
        },
        "external-bndl-backup": {
            "hsimp": "yhs-264",
            "hspart": "mozilla",
            "frCodeChrome": "mozcustbkup",
            "frCodeFirefox": "mozcustbkup",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "typeHomePage": "mozcustbkup",
            "amp_desc_dist": "bndl-backup",
            "hpYhsParam": "10017",
            "typeParam": "yhs-mozilla-264",
            "typeDefault": "yhs-mozilla-264"
        },
        "external-bndl-foxload-de": {
            "frCodeChrome": "foxload",
            "frCodeFirefox": "foxload",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "amp_desc_dist": "bundle",
            "ffHomepageURL": "https://de.search.yahoo.com/firefox/?fr=foxload-sfp"
        },
        "external-bndl-foxload-fr": {
            "frCodeChrome": "foxload",
            "frCodeFirefox": "foxload",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "amp_desc_dist": "bundle",
            "ffHomepageURL": "https://fr.search.yahoo.com/firefox/?fr=foxload-sfp"
        },
        "external-bndl-foxload-uk": {
            "frCodeChrome": "foxload",
            "frCodeFirefox": "foxload",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "amp_desc_dist": "bundle",
            "ffHomepageURL": "https://uk.search.yahoo.com/firefox/?fr=foxload-sfp"
        },
        "external-oracle-newtab-offer": {
            "frCodeChrome": "yset_control_chr_oracle",
            "frCodeFirefox": "yset_control_ff_oracle",
            "partnerCode": "oracle",
            "chrome_space_id": 151340119,
            "firefox_space_id": 151340118,
            "searchType": "fr",
            "trendingNow": {
                "type": "orcl"
            },
            "amp_desc_dist": "oracle-offer"
        },
        "external-oo-srp-promo-chr": {
            "frCodeChrome": "yset_chr_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "trendingNow": {
                "type": "ono"
            },
            "typeParam": "bnr_chrnewtabsrp",
            "typeHomePage": "bnr_chrnewtabsrp",
            "typeDefault": "bnr_chrnewtabsrp",
            "amp_desc_dist": "oo-srp-promo-chr"
        },
        "external-oo-srp-promo-ff": {
            "hsimp": "yhs-102",
            "hspart": "mozilla",
            "frCodeFirefox": "yset_ff_hp_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "trendingNow": {
                "type": "ono"
            },
            "typeParam": "bnr_ffnewtabsrp",
            "typeHomePage": "bnr_ffnewtabsrp",
            "typeDefault": "bnr_ffnewtabsrp",
            "amp_desc_dist": "oo-srp-promo-ff"
        },
        "external-oo-syc-promo-chr": {
            "frCodeChrome": "yset_chr_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "trendingNow": {
                "type": "ono"
            },
            "typeParam": "bnr_chrnewtabsyc",
            "typeHomePage": "bnr_chrnewtabsyc",
            "typeDefault": "bnr_chrnewtabsyc",
            "amp_desc_dist": "oo-syc-promo-chr"
        },
        "external-oo-syc-promo-ff": {
            "hsimp": "yhs-102",
            "hspart": "mozilla",
            "frCodeFirefox": "yset_ff_hp_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "trendingNow": {
                "type": "ono"
            },
            "typeParam": "bnr_ffnewtabsyc",
            "typeHomePage": "bnr_ffnewtabsyc",
            "typeDefault": "bnr_ffnewtabsyc",
            "amp_desc_dist": "oo-syc-promo-ff"
        },
        "external-mktgsem": {
            "frCodeChrome": "yset_chr_nt_mktgsem",
            "frCodeFirefox": "yset_ff_nt_mktgsem",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "trendingNow": {
                "type": "ono"
            },
            "amp_desc_dist": "mktgsem"
        },
        "external-sports": {
            "hsimp": "yhs-102",
            "hspart": "mozilla",
            "frCodeChrome": "yset_chr_cnewtab",
            "frCodeFirefox": "yset_ff_hp_cnewtab",
            "frCodeSafari": "yset_sf_cnewtab",
            "partnerCode": "yahoo",
            "searchType": "fr",
            "typeParam": "sports",
            "typeDefault": "sports",
            "amp_desc_dist": "sports"
        },
        "external-befrugal-chr": {
            "frCodeChrome": "dss_befrugal",
            "partnerCode": "befrugal",
            "searchType": "fr",
            "trendingNow": {
                "type": "ono"
            },
            "breakingNewsFrCode": "yset_chr_newtab_brkg",
            "amp_desc_dist": "befrugal"
        },
        "external-kingsoft-chr": {
            "frCodeChrome": "dss_kingsoft",
            "partnerCode": "kingsoft",
            "searchType": "fr",
            "trendingNow": {
                "type": "ono"
            },
            "breakingNewsFrCode": "yset_chr_newtab_brkg",
            "amp_desc_dist": "kingsoft"
        }
    };

    this.amp_desc_type = "newtab";
    this.amp_desc_dist_default = "oo";

    //Common distribution variables
    this.typeParam = "newtab";
    this.typeDefault = "default";
    this.typeIcon = "icon";
    this.typeHomePage = "hpset";
    this.chrome_space_id = 151340124;
    this.firefox_space_id = 151340125;
    this.safari_space_id = 151340134;

    this.mktg_external = "external-mktgsem";
    this.mktg_url = "https://6824905.fls.doubleclick.net/activityi;src=6824905;type=nwtb;cat=nwtbconf;u1={GUID};u2={USERTYPE};u4={BROWSER};dc_lat=;dc_rdid=;tag_for_child_directed_treatment=;ord=1?";

    //Firefox Specific Constants
    this.amo_addon_url_regexp = "addons\.mozilla\.org\/.*\/firefox\/addon\/.*new-tab-by-yahoo"; // .* is for language, which could be en-US, fr, etc.
    this.yahoo_url_regexp = ".*.yahoo.*";
    this.amo_addon_toolbar_url_regexp = "addons\.mozilla\.org\/.*\/firefox\/addon\/yahoo-toolbar-and-new-tab"; // .* is for language, which could be en-US, fr, etc.
    this.chrome_ext_url_pattern = "*://chrome.google.com/webstore/detail/search-and-new-tab-by-yah*";
    this.amo_pattern_url = "*://addons.mozilla.org/*/firefox/addon/search-and-new-tab-by-yahoo*"; //used by webExtension
    this.yahoo_pattern_url = "https://*.yahoo.com/*"; //used by webExtension
    this.browser_newtab_url = "browser.yahoo.newtab.url";
    this.extensions_newtab_oldnewtab_url = "extensions.yahoo.newtab.oldnewtab.url";
    this.yahoo_content_enhancer = "yahoo-content-enhancer";
    this.yahoo_content_enhancer_prompt = "yahoo-content-enhancer-prompt";
    this.searchbox_newtab_focus = "yahoo_newtab_search";
    this.privacy_url = "https://policies.yahoo.com/us/en/yahoo/privacy/index.htm";
    this.terms_url = "https://policies.yahoo.com/us/en/yahoo/terms/utos/index.htm";
    this.protect_interval = 1296000000; // = 15 days = 15 * 24 * 60 * 60 * 1000 milli sec.
    this.tag_url = "Url";
    this.tag_param = "Param";
    this.attribute_name = "name";
    this.attribute_value = "value";
    this.attribute_template = "template";
    this.text_xml = "text/xml";
    this.general_useragent_locale = "general.useragent.locale";
    this.search_protect_accept = "acceptDiv";
    this.search_protect_decline = "declineButton";
    this.tracker_searchProtectArea_p_accept = 1;
    this.tracker_searchProtectArea_p_decline = 2;
    this.tracker_gpos_searchSetDialog = 5;
    this.tracker_searchSetDialog_p_okay = 1;
    this.tracker_searchSetDialog_p_cancel = 2;
    this.tracker_searchSetDialog_sec_okay = "ff_searchset_dialog_okay";
    this.tracker_searchSetDialog_sec_cancel = "ff_searchset_dialog_cancel";
    this.tracker_searchSetDialog_slk_okay = "okay";
    this.tracker_searchSetDialog_slk_cancel = "cancel";
    this.tracker_searchSet_delc = "ext_ss";
    this.tracker_reject = "reject";
    this.old_home_page = "old_home_page_url";
    this.old_search_provider = "old_search_provider_name";
    this.browser_homepage_pref = "browser.startup.homepage";
    this.search_hspart_val = "mozilla";
    this.localized_strings_keys_ff = [
        "newtab_extension_search_box_label",
        "newtab_extension_photo_label",
        "newtab_extension_on_flickr",
        "newtab_extension_tab_title",
        "newtab_firefox_extension_search_protect_prompt_part1",
        "newtab_firefox_extension_search_protect_prompt_part2",
        "newtab_firefox_extension_search_protect_accept",
        "newtab_firefox_extension_search_protect_decline",
        "newtab_extension_show_image",
        "newtab_extension_show_topsites",
        "newtab_extension_feedback_link_label",
        "newtab_extension_feedback_link",
        "newtab_extension_trending_now_label",
        "newtab_extension_add_url",
        "newtab_extension_add_title",
        "newtab_extension_enter_url",
        "newtab_extension_enter_title",
        "newtab_extension_edit_settings_label",
        "newtab_extension_done_settings_label",
		    "newtab_extension_homepage_url",
        "newtab_extension_hide_tn",
        "newtab_extension_show_tn",
        "newtab_extension_show_wthr",
        "newtab_extension_hide_wthr",
        "newtab_extension_show_fah",
        "newtab_extension_show_Cel",
        "newtab_extension_prompt_search",
        "newtab_extension_keep_current",
        "newtab_extension_ok",
        "newtab_extension_cancel",
        "newtab_extension_quick_search_prompt",
        "newtab_extension_quick_search_description_1",
        "newtab_extension_quick_search_description_2",
        "newtab_extension_options",
        "newtab_extension_page_focus_label",
        "newtab_extension_page_focus_address_bar",
        "newtab_extension_page_focus_search_box",
        "newtab_extension_quick_search_label",
        "newtab_extension_quick_search_checkbox",
        "newtab_extension_quick_search_checkbox_details",
        "newtab_extension_feedback",
        "newtab_extension_privacy",
        "newtab_extension_first_tab_prompt_title",
        "newtab_extension_first_tab_prompt_details"
    ];
    this.localized_search_strings_keys_ff = [
        "newtab_extension_search_prov_domain",
        "newtab_extension_search_prov_path",
        "newtab_extension_search_suggest_domain",
        "newtab_extension_search_suggest_path"
    ];
    this.localized_weather_strings_keys_ff = [
        "tornado_label",
        "tropical_storm_label",
        "hurricane_label",
        "severe_thunderstorms_label",
        "thunderstorms_label",
        "mixed_rain_and_snow_label",
        "mixed_rain_and_sleet_label",
        "mixed_snow_and_sleet_label",
        "freezing_drizzle_label",
        "drizzle_label",
        "freezing_rain_label",
        "showers_label",
        "snow_flurries_label",
        "light_snow_showers_label",
        "blowing_snow_label",
        "snow_label",
        "hail_label",
        "sleet_label",
        "dust_label",
        "foggy_label",
        "haze_label",
        "smoky_label",
        "blustery_label",
        "windy_label",
        "cold_label",
        "cloudy_label",
        "mostly_cloudy_label",
        "partly_cloudy_label",
        "clear_label",
        "sunny_label",
        "fair_label",
        "mixed_rain_and_hail_label",
        "hot_label",
        "isolated_thunderstorms_label",
        "scattered_thunderstorms_label",
        "scattered_thunderstorms_label",
        "scattered_showers_label",
        "heavy_snow_label",
        "scattered_snow_showers_label",
        "thundershowers_label",
        "snow_showers_label",
        "isolated_thundershowers_label"
    ];
    this.ff_newtab_localization = {
        "New Tab": true, //en-US, en-GB
        "Nova aba": true, //pt-BR
        "Neuer Tab": true, //de
        "Nueva pestaña": true, //es-ES, es-MX, es-AR, es-CL
        "Nouvel onglet": true, //fr
        "新分頁": true, //zh-TW
        "Nuova scheda": true, //it
        "Ny flik": true, //sv-SE
        "Tab mới": true, //vi
        "แท็บใหม่": true, //th
        "Tab Baru": true, //id
        "Novo separador": true, //pt-PT
        "Nieuw tabblad": true, //nl
        "Новая вкладка": true, //ru
        "Uusi välilehti": true, //fi
        "Nowa karta": true, //pl
        "Nyt faneblad": true, //da
        "Pestanya nova": true, //ca
        "Ny fane": true, //nb-NO
        "Filă nouă": true, //ro
        "لسان جديد": true, //ar
        "Yeni sekme": true, //tr
        "新規タブ": true, //jp
        "新标签页": true //zh-CN
    };

    this.offlinePhotos = [
        {
            title: "New Mexico Sands",
            owner: "126360766@N06",
            url_l: "offlinephotos/newmexico.JPG",
            dataURL: "offlinephotos/newmexico.JPG",
            ownername: "Suraj Saripalli"
        }
    ];

    this.finance_quotes_url = "http://partner-query.finance.yahoo.com/v6/finance/quote/?symbols={QUOTES}&formatted=true&lang=en-US&region=US&modules=quoteType,summaryDetail,description,quoteDetail,price";
    this.finance_basic_quotes_url = "https://partner-query.finance.yahoo.com/v6/finance/basicQuote/?symbols={QUOTES}&formatted=true&lang=en-US&region=US&debug=true&crumb={CRUMB}";
    //this.finance_trending_url = "http://finance-yql.v1.production.manhattan.gq1.yahoo.com/v1/finance/trending/us?debug=true";
    this.finance_news_url = "https://partner-query.finance.yahoo.com/v2/finance/quotefeeds?count=20&symbols={QUOTES}";
    //this.finance_top_news_url = "https://finance.mobile.yahoo.com/dp/v2/newsfeed?category=generalnews&count=20";
    this.finance_autosuggest_quote = 'https://partner-query.finance.yahoo.com/v6/finance/autocomplete?query={QUERY}&region=us&lang=en-us';
    this.finance_watchlist_url = "https://partner-query.finance.yahoo.com/v6/finance/portfolio";
    this.finance_crumb_url = "https://partner-query.finance.yahoo.com/v1/test/getcrumb";
    this.finance_property_url = "https://finance.yahoo.com";
    this.finance_quote_page = "https://finance.yahoo.com/quote/";
    this.defaultQuotes = ["^DJI", "^GSPC", "^IXIC", "FB", "AAPL", "VZ"];
    this.finance_add_new_quote = "addNewQuote";
    this.finance_add_symbol_button = "addSymbolBtn";
    this.finance_log_out_button = "logOutBtn";
    this.finance_more_news_button = "moreNewsBtn";
    this.finance_news_article = "newsArticle";
    this.finance_quote_link = "quoteLink";
    this.finance_delete_quote_btn = "deleteQuoteBtn";
    this.finance_portfolio_link = "portfolioLink";
    this.finance_portfolio_url = "https://finance.yahoo.com/portfolio/{p_id}/view/v1";
    this.normalAnimation = 400;
    this.slowAnimation = 600;
    this.financeUI = false;
    this.breakingNewsUI = true;
    this.financeQuotesShowMax = 6;
    this.financeNewsShowMax = 8;
    this.financeQuotesSuggestMax = 6;

    //Chrome Specific Contstants
    this.clueAttemptCount = 5;
    this.clueAttemptTimeout = 5 * 1000;
    this.extensionUninstallUrl = "https://downloads.yahoo.com/goodbye";

    //Bucket Tracking
    this.bucket_freshInstall = "freshInstall";
    this.bucket_permissions = {};
    this.bucket_upgradePath = {};

    //sports specific constant for Chrome
    this.sportsUI = false;
    this.sports_home = "https://sports.yahoo.com";
    this.sports_trendingID_url = "https://api-secure.sports.yahoo.com/v1/editorial/s/trending_game_ids?trending_config=new_tab&ysp_new_tab=1";//works on IP address
    this.default_gameType= "mlb";
    //sports scoreBoard
    this.scoreBoard_url = "https://api-secure.sports.yahoo.com/v1/editorial/s/scoreboard?lang=en-US&region=US&tz=America%2FLos_Angeles&ysp_redesign=1&leagues={GAME}&date=current&v=2&ysp_enable_last_update=1&ssl=true&ysp_new_tab=1";

    this.sports_interval = 900000;// 15 mins
    this.mlb_standing = {
        'conference_abbr': 'AL',
        'conference': 'American League',
        'division': 'East'
    };
    this.nfl_standing = {
        'conference_abbr': 'AFC',
        'conference': 'American',
        'division': 'East'
    };
    this.nhl_standing = {
        'conference_abbr': '',
        'conference': 'Eastern',
        'division': 'Atlantic'
    };
    this.nba_standing = {
        'conference_abbr': '',
        'conference': 'Eastern',
        'division': 'Atlantic'
    };

    //sports standings
    this.standings_url = "https://api-secure.sports.yahoo.com/v1/editorial/league/{STANDINGS};enable_structure=1;out=seasons;season=standings/teams;season=;division=;top_division_only=;conf_id=;out=images:only_type=image.type.team_logo_sportacular_white_bg,standings/stat_categories;alias=full_standings;season=;season_period=/stat_types/stats?lang=en-US&region=US&tz=America%2FLos_Angeles&ysp_grand_slam=1&ysp_redesign=1&format=json&ssl=true&ysp_new_tab=1";
    this.more_standings_url = "https://sports.yahoo.com/{GAME}/standings/";

    //trendingPlayers
    this.player_part1 = "https://api-secure.sports.yahoo.com/v1/editorial/team/";
    this.player_part2 = "/players;out=bio,positions,depth_chart_positions/images;width=124;height=172;type=large_cutout_hd?ysp_grand_slam=1&lang=en-US&format=json&ysp_new_tab=1";

    //trendingNews
    this.news_part1 = "https://api-secure.sports.yahoo.com/v1/editorial/article_index;use_top_headlines=1;out=text;count=4;content_types=lgns;leagues=";
    this.news_part2 = "?ssl=1&lang=&format=json&ysp_new_tab=1";

    //For the beacon
    this.sports_standings_link = 'standings';
    this.sports_live_link = 'live';
    this.sports_upcoming = 'upcoming';
    
}

