# Changelog

## v4.0.0 (2021-08-30)

This breaking change drops support for old versions of ESLint, Prettier and
Node. You must use at least ESLint v7.28.0, Prettier v2.0.0 and Node v12.0.0.
Aside from that, usage of this plugin remains identical.

* v4 - Drop support for eslint 5/6, prettier 1, node 6/8 ([#429](git@github.com:prettier/eslint-plugin-prettier/issues/429)) ([acb56f3](git@github.com:prettier/eslint-plugin-prettier/commit/acb56f3b2891b2a6998a75a7d4406183d452ba16))

## v3.4.1 (2021-08-20)

* build(deps): Bump glob-parent from 5.0.0 to 5.1.2 ([#420](git@github.com:prettier/eslint-plugin-prettier/issues/420)) ([b6d075c](git@github.com:prettier/eslint-plugin-prettier/commit/b6d075cf7111468e8af4161c306c7f37f09f220e))
* build(deps): Bump path-parse from 1.0.6 to 1.0.7 ([#425](git@github.com:prettier/eslint-plugin-prettier/issues/425)) ([24f957e](git@github.com:prettier/eslint-plugin-prettier/commit/24f957ee2a5476bb9cc8e64921b9841fc751391e))
* feat: support `@graphql-eslint/eslint-plugin` out of box ([#413](git@github.com:prettier/eslint-plugin-prettier/issues/413)) ([ec6fbb1](git@github.com:prettier/eslint-plugin-prettier/commit/ec6fbb159e2454c6e145db55480932dc953cf7c1))
* chore: add tests for Node 16 ([#410](git@github.com:prettier/eslint-plugin-prettier/issues/410)) ([76bd45e](git@github.com:prettier/eslint-plugin-prettier/commit/76bd45ece6d56eb52f75db6b4a1efdd2efb56392))

## v3.4.0 (2021-04-15)

* feat: support processor virtual filename ([#401](git@github.com:prettier/eslint-plugin-prettier/issues/401)) ([ee0ccc6](git@github.com:prettier/eslint-plugin-prettier/commit/ee0ccc6ac06d13cd546e78b444e53164f59eb27f))
* Simplify report logic ([#380](git@github.com:prettier/eslint-plugin-prettier/issues/380)) ([d993f24](git@github.com:prettier/eslint-plugin-prettier/commit/d993f247b5661683af031ab3b93955a0dfe448fa))
* Update: README.md ([#375](git@github.com:prettier/eslint-plugin-prettier/issues/375)) ([3ea4242](git@github.com:prettier/eslint-plugin-prettier/commit/3ea4242a8d4acdb76eb7e7dca9e44d3e87db70e3))

## v3.3.1 (2021-01-04)

* fix: add eslint-config-prettier as an optional peer dependency ([#374](git@github.com:prettier/eslint-plugin-prettier/issues/374)) ([d59df27](git@github.com:prettier/eslint-plugin-prettier/commit/d59df27890aaffec9e528ceb3155831a0261848d))
* build(deps-dev): bump eslint from 7.16.0 to 7.17.0 ([b87985d](git@github.com:prettier/eslint-plugin-prettier/commit/b87985d8b1986743374b56691bcc1633df8f4eae))
* build(deps-dev): bump eslint from 7.15.0 to 7.16.0 ([11e427e](git@github.com:prettier/eslint-plugin-prettier/commit/11e427e5d6cedeb26e3e03c8143be3496a24955a))

## v3.3.0 (2020-12-13)

* Minor: Perf improvement: Do not clear the config cache on each run ([#368](git@github.com:prettier/eslint-plugin-prettier/issues/368)) ([1b90ea7](git@github.com:prettier/eslint-plugin-prettier/commit/1b90ea752636959babb27ebca5d67093c346dab9))
* Add peerDependenciesMeta block ([#367](git@github.com:prettier/eslint-plugin-prettier/issues/367)) ([86608d5](git@github.com:prettier/eslint-plugin-prettier/commit/86608d5084692ab0d1f2f49a3df4909d04c39ae7))
* build(deps-dev): bump eslint from 7.14.0 to 7.15.0 ([885f484](git@github.com:prettier/eslint-plugin-prettier/commit/885f48405e0fc9f312acdd3e3487c824bd59c102))
* build(deps-dev): bump eslint from 7.3.1 to 7.14.0 ([cebc80b](git@github.com:prettier/eslint-plugin-prettier/commit/cebc80b39d3d09f957a73536e54f6d8dd4567080))

## v3.2.0 (2020-12-03)

* Skip CI for eslint 6 + node 8 ([#364](git@github.com:prettier/eslint-plugin-prettier/issues/364)) ([f8f08e4](git@github.com:prettier/eslint-plugin-prettier/commit/f8f08e483522d74bc4dd93d9813914aa7ba9314b))
* Turn off problematic rules in recommended config (prepare for next eslint-config-prettier version) ([#360](git@github.com:prettier/eslint-plugin-prettier/issues/360)) ([a1e5591](git@github.com:prettier/eslint-plugin-prettier/commit/a1e559112073eedfb0dd2041b9c2f6ef775844ec))
* Create dependabot.yml ([f58b6c7](git@github.com:prettier/eslint-plugin-prettier/commit/f58b6c7c356a37b437593cd6ff8d1dca1c437b13))
* docs(README): fix prettier getFileInfo link ([#335](git@github.com:prettier/eslint-plugin-prettier/issues/335)) ([5a690f1](git@github.com:prettier/eslint-plugin-prettier/commit/5a690f14d793ba5a08c55287fa3d6338dcda21ba))
* build(deps-dev): bump eslint-plugin-eslint-plugin from 2.2.2 to 2.3.0 ([8614c45](git@github.com:prettier/eslint-plugin-prettier/commit/8614c458ed284bc126034d432b49b07d7d67ef06))
* build(deps-dev): bump eslint from 7.3.0 to 7.3.1 ([12d9ed8](git@github.com:prettier/eslint-plugin-prettier/commit/12d9ed877aacfad2c27f01161cc2eb28a445725f))
* build(deps-dev): bump eslint from 7.2.0 to 7.3.0 ([5a6f42e](git@github.com:prettier/eslint-plugin-prettier/commit/5a6f42e4eda871a294da1eb55f214c475450faa6))
* chore: update CI badge in readme ([5012b66](git@github.com:prettier/eslint-plugin-prettier/commit/5012b665f981edbc21feaaccb3cd297f49ca40d3))
* Use Github Actions for CI ([#305](git@github.com:prettier/eslint-plugin-prettier/issues/305)) ([41eb64f](git@github.com:prettier/eslint-plugin-prettier/commit/41eb64fda33663ed1c43a85218f390c6cd4b6191))

## v3.1.4 (2020-06-14)

* Avoid clearing Prettier cache when not using prettierrc ([#303](git@github.com:prettier/eslint-plugin-prettier/issues/303)) ([3c8e2d9](git@github.com:prettier/eslint-plugin-prettier/commit/3c8e2d9871d86a82b10fe3d54f32bb5a54f2913b))
* build(deps-dev): bump eslint-plugin-eslint-plugin from 2.2.1 to 2.2.2 ([93f7c8b](git@github.com:prettier/eslint-plugin-prettier/commit/93f7c8be7c99a0c3e4b11be6a5311316f76e6e08))
* build(deps-dev): bump eslint from 7.1.0 to 7.2.0 ([650ac7a](git@github.com:prettier/eslint-plugin-prettier/commit/650ac7a40c1f4d46b0bd37efad3eed84f8155a44))
* build(deps-dev): bump eslint-plugin-self from 1.2.0 to 1.2.1 ([6449ec1](git@github.com:prettier/eslint-plugin-prettier/commit/6449ec151f119e98d69da91ad6d10dbb374162d8))
* build(deps-dev): bump eslint from 7.0.0 to 7.1.0 ([fd30022](git@github.com:prettier/eslint-plugin-prettier/commit/fd30022a51a57a4e96dd4ab3e04956b945886874))
* Chore: Add CI tests for ESLint 7 ([#291](git@github.com:prettier/eslint-plugin-prettier/issues/291)) ([cc2979b](git@github.com:prettier/eslint-plugin-prettier/commit/cc2979b68258b8545931ce37168adfe17b1d3a7b))
* build(deps-dev): bump eslint-config-prettier from 6.10.1 to 6.11.0 ([35a7ee6](git@github.com:prettier/eslint-plugin-prettier/commit/35a7ee68b02ea3088270210ac8dc85ff47ef65a9))

## v3.1.3 (2020-04-13)

* Fix: Set `meta.type` to "layout" ([#283](git@github.com:prettier/eslint-plugin-prettier/issues/283)) ([97152e2](git@github.com:prettier/eslint-plugin-prettier/commit/97152e2787bf9bb27f053d6a91ccf826dc96a505))
* build(deps-dev): bump eslint-config-prettier from 6.10.0 to 6.10.1 ([185b106](git@github.com:prettier/eslint-plugin-prettier/commit/185b1064d3dd674538456fb2fad97fbfcde49e0d))
* build(deps): [security] bump acorn from 6.1.0 to 6.4.1 ([bba5881](git@github.com:prettier/eslint-plugin-prettier/commit/bba588151e860b1a644096441b31a0f3144db611))
* build(deps-dev): bump eslint-config-prettier from 6.9.0 to 6.10.0 ([9a47a6f](git@github.com:prettier/eslint-plugin-prettier/commit/9a47a6feab691cf228d184c103d4cab99b464d0b))
* build(deps-dev): bump eslint-plugin-eslint-plugin from 2.2.0 to 2.2.1 ([aad671d](git@github.com:prettier/eslint-plugin-prettier/commit/aad671d5123a2fd20e4396d591e25335d7219950))
* build(deps-dev): bump eslint-plugin-eslint-plugin from 2.1.0 to 2.2.0 ([e2458c2](git@github.com:prettier/eslint-plugin-prettier/commit/e2458c2d41825f94441dc7d552da37aede95ffe7))
* build(deps-dev): bump eslint-config-prettier from 6.8.0 to 6.9.0 ([05ef06f](git@github.com:prettier/eslint-plugin-prettier/commit/05ef06ffdda2bb485a2175243e6a8a167a01466c))
* build(deps-dev): bump eslint-config-prettier from 6.7.0 to 6.8.0 ([ab80b3c](git@github.com:prettier/eslint-plugin-prettier/commit/ab80b3c5d30ea605aa363f13078aef9e0b697b6e))
* build(deps-dev): bump eslint from 6.7.2 to 6.8.0 ([dea1b30](git@github.com:prettier/eslint-plugin-prettier/commit/dea1b30361921d7160aaf44d5302c5cc6490f87a))

## v3.1.2 (2019-12-15)

* Resolve config when getting list of inferred parsers ([1ad45be](git@github.com:prettier/eslint-plugin-prettier/commit/1ad45be48ea1ed16e0eb3ba6247163724b956516))
* Fix tests now they to stop them inheriting from base prettierrc file ([14840fa](git@github.com:prettier/eslint-plugin-prettier/commit/14840fa4c88c938bf30c1fdf1c26c32b2708a3b6))
* Move prettier config into dedicated file, so vscode plugins pick it up ([c49334a](git@github.com:prettier/eslint-plugin-prettier/commit/c49334a846afa6f688695a4774f7824ee3a05e1c))
* build(deps-dev): bump eslint from 6.7.1 to 6.7.2 ([15e6cf9](git@github.com:prettier/eslint-plugin-prettier/commit/15e6cf91509cb5b819d2e1fb19dbe9bc71c87893))
* build(deps-dev): bump eslint from 6.6.0 to 6.7.1 ([e8ad019](git@github.com:prettier/eslint-plugin-prettier/commit/e8ad0195000af416f3315396e9c02fea261391cc))
* build(deps-dev): bump eslint-config-prettier from 6.6.0 to 6.7.0 ([44f4bfe](git@github.com:prettier/eslint-plugin-prettier/commit/44f4bfe0b6f63234afeba266928b39b762269282))
* build(deps-dev): bump eslint-config-prettier from 6.5.0 to 6.6.0 ([46580c5](git@github.com:prettier/eslint-plugin-prettier/commit/46580c55914057dee5089e9c6e525e41996888d1))
* build(deps-dev): bump prettier from 1.18.2 to 1.19.1 ([10b4676](git@github.com:prettier/eslint-plugin-prettier/commit/10b46763fd007a8f939e43635831aec590717e87))
* build(deps-dev): bump eslint from 6.5.1 to 6.6.0 ([53eaeae](git@github.com:prettier/eslint-plugin-prettier/commit/53eaeaec91c158b66cc04dbf80f9631bb82285bf))
* build(deps-dev): bump eslint-config-prettier from 6.4.0 to 6.5.0 ([ad3321c](git@github.com:prettier/eslint-plugin-prettier/commit/ad3321c3ae6e963317fedcdd205ba719bf933d74))
* build(deps-dev): bump mocha from 6.2.1 to 6.2.2 ([b7280b6](git@github.com:prettier/eslint-plugin-prettier/commit/b7280b68eaae243aa33de364576cddf0844c6848))
* build(deps-dev): bump eslint-config-prettier from 6.3.0 to 6.4.0 ([4c1d69a](git@github.com:prettier/eslint-plugin-prettier/commit/4c1d69a8022c709cd62e964a82c7dbc7963f0544))
* build(deps-dev): bump eslint from 6.5.0 to 6.5.1 ([c109a7a](git@github.com:prettier/eslint-plugin-prettier/commit/c109a7a5acca9533feae6258e9ac4934359ed9b3))
* build(deps-dev): bump mocha from 6.2.0 to 6.2.1 ([3134bea](git@github.com:prettier/eslint-plugin-prettier/commit/3134beab61dee13aa2c73762a55f51f868553e8a))
* build(deps-dev): bump eslint from 6.4.0 to 6.5.0 ([7c290d7](git@github.com:prettier/eslint-plugin-prettier/commit/7c290d799e319b39519d81a110b62846894bc7ba))

## v3.1.1 (2019-09-18)

* build(deps-dev): bump eslint from 6.3.0 to 6.4.0 ([8a793eb](git@github.com:prettier/eslint-plugin-prettier/commit/8a793eba54ff01493e3ee83daf4dcb782d039fdd))
* build(deps-dev): bump eslint-config-prettier from 6.2.0 to 6.3.0 ([88c3f6c](git@github.com:prettier/eslint-plugin-prettier/commit/88c3f6cb510b758e6dc866a1ad1a0484ef074484))
* build(deps-dev): bump eslint-config-prettier from 6.0.0 to 6.2.0 ([5f9fbc1](git@github.com:prettier/eslint-plugin-prettier/commit/5f9fbc16f91d88a5c77b8b9d942b82424add77a5))
* build(deps-dev): bump eslint from 6.2.2 to 6.3.0 ([746b66d](git@github.com:prettier/eslint-plugin-prettier/commit/746b66dc701e8226930f6e4d8386bd500dcb303b))
* build(deps-dev): bump eslint from 6.1.0 to 6.2.2 ([97eedb4](git@github.com:prettier/eslint-plugin-prettier/commit/97eedb4734a4c569d4c24a62cffe024c2a26c178))
* build(deps-dev): bump eslint from 6.0.1 to 6.1.0 ([afef9d1](git@github.com:prettier/eslint-plugin-prettier/commit/afef9d137c8b7887c63e3f8d51cabf42851f5cf1))
* build(deps-dev): bump mocha from 6.1.4 to 6.2.0 ([0360a84](git@github.com:prettier/eslint-plugin-prettier/commit/0360a845ce530d8c25f390961d6446b4c58e85ac))
* build(deps): [security] bump lodash from 4.17.11 to 4.17.14 ([9eceb68](git@github.com:prettier/eslint-plugin-prettier/commit/9eceb6834fcd003c5680c3202b656ca3474c19c2))
* Fix: When forcing the JS parser, use the modern name ([#212](git@github.com:prettier/eslint-plugin-prettier/issues/212)) ([1385310](git@github.com:prettier/eslint-plugin-prettier/commit/1385310fce778a8c771d0dab0e400725c9f9d82e))
* Add eslint 6 to test matrix ([#210](git@github.com:prettier/eslint-plugin-prettier/issues/210)) ([bca77e6](git@github.com:prettier/eslint-plugin-prettier/commit/bca77e66ed1eba682eb13055862adc70478d472b))
* build(deps-dev): bump eslint-config-prettier from 5.0.0 to 6.0.0 ([4c069bd](git@github.com:prettier/eslint-plugin-prettier/commit/4c069bd0f3b907039569964e747479aa06279594))
* build(deps-dev): bump eslint-config-prettier from 4.3.0 to 5.0.0 ([60bb22f](git@github.com:prettier/eslint-plugin-prettier/commit/60bb22f4ae1d6af001ba55338a7cb08111db23d9))
* build(deps-dev): bump prettier from 1.18.0 to 1.18.2 ([a183560](git@github.com:prettier/eslint-plugin-prettier/commit/a1835600facebc819e31a0816061e62f8be2cd8b))
* build(deps-dev): bump prettier from 1.17.1 to 1.18.0 ([0cad479](git@github.com:prettier/eslint-plugin-prettier/commit/0cad4793abb6139eb9d6853b5adef7469aef756d))
* build(deps-dev): bump eslint-config-prettier from 4.2.0 to 4.3.0 ([6f3c76f](git@github.com:prettier/eslint-plugin-prettier/commit/6f3c76fd75dc4f982d1221e6b4802329b32176a9))
* build(deps-dev): bump prettier from 1.17.0 to 1.17.1 ([03aecfd](git@github.com:prettier/eslint-plugin-prettier/commit/03aecfd49b96d055ff54ec989c93408a9fb3f3ee))

## v3.1.0 (2019-05-11)

* New: Allow options to be passed to prettier.getFileInfo ([#187](https://github.com/prettier/eslint-plugin-prettier/issues/187)) ([21fa69a](https://github.com/prettier/eslint-plugin-prettier/commit/21fa69a8ed3b6acfc5461f6c3332444c21e65e28))
* build(deps-dev): bump eslint-plugin-eslint-plugin from 2.0.1 to 2.1.0 ([bb597e1](https://github.com/prettier/eslint-plugin-prettier/commit/bb597e14aba46211fd4149d0b0f1bdc51fe76452))
* build(deps-dev): bump eslint-config-prettier from 4.1.0 to 4.2.0 ([0bb7c1d](https://github.com/prettier/eslint-plugin-prettier/commit/0bb7c1d361b581fddebd64bf172b5dedcad5149c))
* build(deps-dev): bump vue-eslint-parser from 6.0.3 to 6.0.4 ([2f77df4](https://github.com/prettier/eslint-plugin-prettier/commit/2f77df48f151d4975bbdb29ced8c74a72d011428))
* build(deps-dev): bump mocha from 6.1.3 to 6.1.4 ([222b87a](https://github.com/prettier/eslint-plugin-prettier/commit/222b87a347331b20b3e7f65dcdfaa491bd277b3a))
* build(deps-dev): bump prettier from 1.16.4 to 1.17.0 ([58d8ff8](https://github.com/prettier/eslint-plugin-prettier/commit/58d8ff8ab2b1f73c904f5492eb523d7ea585ed8f))
* build(deps-dev): bump mocha from 6.1.2 to 6.1.3 ([e94e56c](https://github.com/prettier/eslint-plugin-prettier/commit/e94e56c36018aab6e08452fbe05bb16a23d64197))
* build(deps-dev): bump mocha from 6.1.1 to 6.1.2 ([c02244b](https://github.com/prettier/eslint-plugin-prettier/commit/c02244b197893f4e2a214d43f755b726cecbd03c))
* build(deps-dev): bump mocha from 6.0.2 to 6.1.1 ([a9a2e4e](https://github.com/prettier/eslint-plugin-prettier/commit/a9a2e4e3c0a243ec73061c10d9c4a5ae0c0e6f68))
* build(deps-dev): bump eslint from 5.15.3 to 5.16.0 ([073c14c](https://github.com/prettier/eslint-plugin-prettier/commit/073c14c2ae5c43d0939fe6f475561f1cf3d7a3e5))
* build(deps-dev): bump eslint from 5.15.2 to 5.15.3 ([bda931f](https://github.com/prettier/eslint-plugin-prettier/commit/bda931f4f1344f6927fbfd3a35965d1a4d319642))
* build(deps-dev): bump eslint from 5.15.1 to 5.15.2 ([19f53d6](https://github.com/prettier/eslint-plugin-prettier/commit/19f53d6a94a701e0aab9630bef93051aec4dfd36))
* build(deps-dev): bump eslint from 5.15.0 to 5.15.1 ([34b39de](https://github.com/prettier/eslint-plugin-prettier/commit/34b39dec2e6e283da1ca6faa0c636c5361efb5b9))
* build(deps-dev): bump eslint from 5.14.1 to 5.15.0 ([13bcc66](https://github.com/prettier/eslint-plugin-prettier/commit/13bcc66c120d614c17040e329360510feab47e7d))
* build(deps-dev): bump eslint-plugin-self from 1.1.0 to 1.2.0 ([5b4adb8](https://github.com/prettier/eslint-plugin-prettier/commit/5b4adb8ce683a93feddad07eda17d99b41849342))
* build(deps-dev): bump vue-eslint-parser from 6.0.2 to 6.0.3 ([e676cd1](https://github.com/prettier/eslint-plugin-prettier/commit/e676cd19387e70102467d9a82014906561f3c225))
* build(deps-dev): bump eslint-config-prettier from 4.0.0 to 4.1.0 ([b8a9215](https://github.com/prettier/eslint-plugin-prettier/commit/b8a9215515cdcb75faf212caeb00dfbcae11ee42))
* build(deps-dev): bump mocha from 6.0.1 to 6.0.2 ([cde36e4](https://github.com/prettier/eslint-plugin-prettier/commit/cde36e4db18ac4442eba3c75a20c1a6605e937d4))
* build(deps-dev): bump mocha from 6.0.0 to 6.0.1 ([eb39699](https://github.com/prettier/eslint-plugin-prettier/commit/eb39699b9bdf7c406a3134cc26c404947534661d))
* build(deps-dev): bump mocha from 5.2.0 to 6.0.0 ([5d75421](https://github.com/prettier/eslint-plugin-prettier/commit/5d75421d5e3ee5f8293b47a5825e1f2415f7e6b9))
* build(deps-dev): bump eslint from 5.14.0 to 5.14.1 ([829156e](https://github.com/prettier/eslint-plugin-prettier/commit/829156e467e53f554691afa687c13715086974f7))
* build(deps-dev): bump eslint from 5.13.0 to 5.14.0 ([b76d0b4](https://github.com/prettier/eslint-plugin-prettier/commit/b76d0b4471845143630b3603b97607665bf66ca0))
* build(deps-dev): bump vue-eslint-parser from 6.0.0 to 6.0.2 ([15439e8](https://github.com/prettier/eslint-plugin-prettier/commit/15439e8e0dcfa11a19f0cf249a1f4ad5f7fa5b96))
* build(deps-dev): bump vue-eslint-parser from 5.0.0 to 6.0.0 ([0ea70e5](https://github.com/prettier/eslint-plugin-prettier/commit/0ea70e5161d315ab93e6c4eb93f76d5304b8c162))
* build(deps-dev): bump eslint from 5.12.1 to 5.13.0 ([5f18729](https://github.com/prettier/eslint-plugin-prettier/commit/5f18729dbe359fe0df10730fd768a1ca6949b0a2))
* build(deps-dev): bump prettier from 1.16.3 to 1.16.4 ([ef637fe](https://github.com/prettier/eslint-plugin-prettier/commit/ef637fea4d6028b472cfe56dcb4fe30ee7939e0d))
* build(deps-dev): bump prettier from 1.16.1 to 1.16.3 ([58ab20c](https://github.com/prettier/eslint-plugin-prettier/commit/58ab20cc03f81a7d668998e64168eef7ad5b4365))
* build(deps-dev): bump eslint-config-prettier from 3.6.0 to 4.0.0 ([14393bd](https://github.com/prettier/eslint-plugin-prettier/commit/14393bdbcfd6114e810c10b4b7f905485474a36f))
* build(deps-dev): bump prettier from 1.16.0 to 1.16.1 ([00198b9](https://github.com/prettier/eslint-plugin-prettier/commit/00198b9795d1341f4c4a488c83f656e74f6bfdb0))
* build(deps-dev): bump prettier from 1.15.3 to 1.16.0 ([7890a87](https://github.com/prettier/eslint-plugin-prettier/commit/7890a876fc1c22b1fdee8724296eaa56eb6df1a3))
* build(deps-dev): bump eslint from 5.12.0 to 5.12.1 ([92a8984](https://github.com/prettier/eslint-plugin-prettier/commit/92a898470fbd88a4f5f4d8e1b15cf53bd7f8a92e))
* build(deps-dev): bump eslint-config-prettier from 3.5.0 to 3.6.0 ([5292d12](https://github.com/prettier/eslint-plugin-prettier/commit/5292d127dfd4f90ec6695d4060b5f5447a2c0119))
* build(deps-dev): bump eslint-config-prettier from 3.4.0 to 3.5.0 ([44a2558](https://github.com/prettier/eslint-plugin-prettier/commit/44a2558820d1c733f1572c98503e7b00b16b3fb7))
* build(deps-dev): bump eslint-config-prettier from 3.3.0 to 3.4.0 ([425cfce](https://github.com/prettier/eslint-plugin-prettier/commit/425cfce1bb712c96dfdd2292b04d89cceb375681))
* build(deps-dev): bump eslint from 5.11.1 to 5.12.0 ([3e9aa39](https://github.com/prettier/eslint-plugin-prettier/commit/3e9aa399ee3c0394a397f6ed3f8ec7c5e1597991))
* build(deps-dev): bump eslint-plugin-node from 8.0.0 to 8.0.1 ([e913afd](https://github.com/prettier/eslint-plugin-prettier/commit/e913afdd7291b5e58adf567f5e7a5bb9257dc9e3))
* build(deps-dev): bump vue-eslint-parser from 4.0.3 to 5.0.0 ([ecfd5ba](https://github.com/prettier/eslint-plugin-prettier/commit/ecfd5bab7bfb36e0203a334808243cb85aaeb512))

## v3.0.1 (2018-12-28)

* Catch and format SyntaxErrors as eslint violations ([#141](https://github.com/prettier/eslint-plugin-prettier/issues/141)) ([4a0e57d](https://github.com/prettier/eslint-plugin-prettier/commit/4a0e57ddcc0fa2ae8e8f7d8b65ddc4ac93d9f474))
* build(deps-dev): bump eslint from 5.11.0 to 5.11.1 ([d34daed](https://github.com/prettier/eslint-plugin-prettier/commit/d34daed47fbda09cbd19a73c38323e0aed0c30d5))
* build(deps-dev): bump eslint from 5.10.0 to 5.11.0 ([7f4f45d](https://github.com/prettier/eslint-plugin-prettier/commit/7f4f45dd132ecd72207b536b86910bebf15693b6))
* build(deps-dev): bump eslint-plugin-eslint-plugin from 2.0.0 to 2.0.1 ([5be3bcf](https://github.com/prettier/eslint-plugin-prettier/commit/5be3bcfce11b741cd35c92b9c972e457a4038766))
* build(deps-dev): bump eslint from 5.9.0 to 5.10.0 ([11e7c44](https://github.com/prettier/eslint-plugin-prettier/commit/11e7c447a8ebcfae213afe6ba872f96adb43e6b9))
* build(deps-dev): bump eslint-plugin-eslint-plugin from 1.4.1 to 2.0.0 ([9e5bf14](https://github.com/prettier/eslint-plugin-prettier/commit/9e5bf140451f82a36c78042315a9f88a12cfe45f))
* build(deps-dev): bump vue-eslint-parser from 4.0.2 to 4.0.3 ([234583a](https://github.com/prettier/eslint-plugin-prettier/commit/234583a19a97ecd1f996542ccb1178a26d20c0fd))
* build(deps-dev): bump vue-eslint-parser from 3.3.0 to 4.0.2 ([8675d57](https://github.com/prettier/eslint-plugin-prettier/commit/8675d5713f5171981119b89c2e8a58fda6b81259))
* Upgrade: Bump vue-eslint-parser from 3.2.2 to 3.3.0 ([2379e93](https://github.com/prettier/eslint-plugin-prettier/commit/2379e93c7fb81ddfe306c1fe6a10d1833cfddf2c))
* Upgrade: Bump eslint-config-prettier from 3.1.0 to 3.3.0 ([3ea0021](https://github.com/prettier/eslint-plugin-prettier/commit/3ea00218961b75e475def14372f9eab0de5ad05d))
* Upgrade: Bump eslint from 5.8.0 to 5.9.0 ([c774fb8](https://github.com/prettier/eslint-plugin-prettier/commit/c774fb87fe53d19389964883f05e77309b321139))
* build(deps-dev): bump eslint-plugin-node from 7.0.1 to 8.0.0 ([#121](https://github.com/prettier/eslint-plugin-prettier/issues/121)) ([2a4fba0](https://github.com/prettier/eslint-plugin-prettier/commit/2a4fba01222f62a576da48478e3dcd832e3bff7e))
* build(deps-dev): bump eslint-plugin-eslint-plugin from 1.4.0 to 1.4.1 ([#120](https://github.com/prettier/eslint-plugin-prettier/issues/120)) ([29caa29](https://github.com/prettier/eslint-plugin-prettier/commit/29caa299612db8af7a188749a5dd8b9827f51a67))
* build(deps-dev): bump eslint from 5.6.0 to 5.8.0 ([#119](https://github.com/prettier/eslint-plugin-prettier/issues/119)) ([2836350](https://github.com/prettier/eslint-plugin-prettier/commit/2836350829dc3c19b4c1ebca33a3a7905c1b28a5))

## v3.0.0 (2018-10-01)

* Chore: Add eslint peer-dependency ([d55d79c](https://github.com/prettier/eslint-plugin-prettier/commit/d55d79c6a64f659f405788fc75f344704619979f))
* Breaking: Extract showInvisibles and generateDifferences ([bf7c40c](https://github.com/prettier/eslint-plugin-prettier/commit/bf7c40c240d9833548a7c9d210a28c90a4f3957b))
* Breaking: Defining prettier options must use an object ([478c7e5](https://github.com/prettier/eslint-plugin-prettier/commit/478c7e5d2165f3e67e893c9a317b602159eaff9c))
* Breaking: Drop support for ESLint v3 and v4 ([2326231](https://github.com/prettier/eslint-plugin-prettier/commit/232623179b16b99c0cf89ec9b8ed7660c69b092d))
* Chore: Update dependencies ([1ec94c8](https://github.com/prettier/eslint-plugin-prettier/commit/1ec94c8e3495f6964588da5264b890cb49616fff))
* Chore: remove two unused dependencies ([bfe459c](https://github.com/prettier/eslint-plugin-prettier/commit/bfe459c39b742115137e81278f03f8e6abfd7dcf))
* Chore: Rename test files to keep them sequential ([d38ea52](https://github.com/prettier/eslint-plugin-prettier/commit/d38ea52debdf9da718c60933f42a709fa05f550f))
* Breaking: Remove pragma support ([3af422c](https://github.com/prettier/eslint-plugin-prettier/commit/3af422c8e301978b611cfc665e052d48c102b443))
* Breaking: Update minimum required pretter version to 1.13.0 ([29c0506](https://github.com/prettier/eslint-plugin-prettier/commit/29c050605674fda2975b3b620c89a7eb9332641a))
* Breaking: Drop support for node v4, v7 and v9 ([be460bd](https://github.com/prettier/eslint-plugin-prettier/commit/be460bdd06fafb04442b440efabc7b36b12934a7))
* Chore: Add vscode config to autoformat on save ([9fac6b4](https://github.com/prettier/eslint-plugin-prettier/commit/9fac6b4039c1983b83073fa7af7864f0d7e1f2d3))
* Chore: Improve travis matrix ([46d2444](https://github.com/prettier/eslint-plugin-prettier/commit/46d244409e397ba9ff2dea621e99a4ea90e0585b))
* Chore: Add format script to run prettier ([d46aa6d](https://github.com/prettier/eslint-plugin-prettier/commit/d46aa6dbd8028802121231d3ae0fe3f837bca9ad))

## v2.7.0 (2018-09-26)

* Update: Support prettierignore and custom processors ([#111](https://github.com/prettier/eslint-plugin-prettier/issues/111)) ([38537ba](https://github.com/prettier/eslint-plugin-prettier/commit/38537ba35fc9152852c3b91f3041d72556b43013))
* Build: switch to release script package ([047dc8f](https://github.com/prettier/eslint-plugin-prettier/commit/047dc8ffdf006c74267df4902fec684c589dad12))

## v2.6.2 (2018-07-06)

* Fix: Add representation for \r to showInvisibles ([#100](https://github.com/prettier/eslint-plugin-prettier/issues/100)) ([731bbb5](https://github.com/prettier/eslint-plugin-prettier/commit/731bbb576ce422a5c73a1fa9750aa3466c7da928))
* Docs: Add clarification about Flow/React support to readme ([#96](https://github.com/prettier/eslint-plugin-prettier/issues/96)) ([977aa77](https://github.com/prettier/eslint-plugin-prettier/commit/977aa77a119f22af3f8ca8d6f47e5bcfcc9e23fb))

## v2.6.1 (2018-06-23)

* Fix: respect editorconfig ([#92](https://github.com/prettier/eslint-plugin-prettier/issues/92)) ([0b04dd3](https://github.com/prettier/eslint-plugin-prettier/commit/0b04dd362d0d92534a7cf11eaebbab8eb59fc96d))

## v2.6.0 (2018-02-02)

* Update: Add option to skip loading prettierrc ([#83](https://github.com/prettier/eslint-plugin-prettier/issues/83)) ([9e0fb48](https://github.com/prettier/eslint-plugin-prettier/commit/9e0fb48d077214a81ac549731308ab11512c37cd))
* Build: add Node 8 and 9 to Travis ([e5b5fa7](https://github.com/prettier/eslint-plugin-prettier/commit/e5b5fa74d06a06a53d04c4748b31e24fcd7a41b9))
* Chore: add test for vue parsing ([1ab43fd](https://github.com/prettier/eslint-plugin-prettier/commit/1ab43fd601a67100cb03bbfe614203fd399d40bb))

## v2.5.0 (2018-01-16)

* Fix: pass filepath to prettier ([#76](https://github.com/prettier/eslint-plugin-prettier/issues/76)) ([0b6ab55](https://github.com/prettier/eslint-plugin-prettier/commit/0b6ab55e0a48e9c31cfa1d7f3b891100e0580493))
* Update: Add URL to rule documentation to the metadata ([#75](https://github.com/prettier/eslint-plugin-prettier/issues/75)) ([804ead7](https://github.com/prettier/eslint-plugin-prettier/commit/804ead7406e12024a1f9c28628024e5d63b75854))

## v2.4.0 (2017-12-17)

* New: Add 'recommended' configuration ([#73](https://github.com/prettier/eslint-plugin-prettier/issues/73)) ([e529b60](https://github.com/prettier/eslint-plugin-prettier/commit/e529b6004b278fb8de660c75d69381ea071b2114))
* Docs: Create ISSUE_TEMPLATE.md ([4335b08](https://github.com/prettier/eslint-plugin-prettier/commit/4335b08f2956f695eda20f9ca41653fe15b6538d))

## v2.3.1 (2017-09-18)

* Fix: Guard against older prettier installation ([#56](https://github.com/prettier/eslint-plugin-prettier/issues/56)) ([8a115f9](https://github.com/prettier/eslint-plugin-prettier/commit/8a115f9cc57dc20c9fc5c2b942f1e4770a5d730e))

## v2.3.0 (2017-09-18)

* Update: Support .prettierrc config files (fixes [#46](https://github.com/prettier/eslint-plugin-prettier/issues/46)) ([#55](https://github.com/prettier/eslint-plugin-prettier/issues/55)) ([bc89153](https://github.com/prettier/eslint-plugin-prettier/commit/bc89153ffa733b3b58f123849485d7990577c216))
* Docs: .eslintrc.json > .eslintrc ([#52](https://github.com/prettier/eslint-plugin-prettier/issues/52)) ([95f0808](https://github.com/prettier/eslint-plugin-prettier/commit/95f0808416f7493426c822790d79cf22b0db0f22))
* Upgrade: jest-docblock to ^21.0.0 ([#50](https://github.com/prettier/eslint-plugin-prettier/issues/50)) ([c777111](https://github.com/prettier/eslint-plugin-prettier/commit/c777111a526c87236b8853d7e253ee93ac1d988d))
* Chore: upgrade prettier to ^1.6.1 ([#49](https://github.com/prettier/eslint-plugin-prettier/issues/49)) ([56deffa](https://github.com/prettier/eslint-plugin-prettier/commit/56deffae056c0165a7ed2b993b7cf78b6c71148a))
* Chore: use eslint-plugin-self for linting ([#47](https://github.com/prettier/eslint-plugin-prettier/issues/47)) ([5ea0526](https://github.com/prettier/eslint-plugin-prettier/commit/5ea05269cc947c2e30a42e5101140ab6faac311a))

## v2.2.0 (2017-08-16)

* New: expose reporter api (fixes [#39](https://github.com/prettier/eslint-plugin-prettier/issues/39)) ([#41](https://github.com/prettier/eslint-plugin-prettier/issues/41)) ([1666067](https://github.com/prettier/eslint-plugin-prettier/commit/1666067aa396dfe6a622eb1d9fd5d21fa851a612))

## v2.1.2 (2017-06-14)

* Chore: Relax peerDependencies ([#30](https://github.com/prettier/eslint-plugin-prettier/issues/30)) ([a19b8af](https://github.com/prettier/eslint-plugin-prettier/commit/a19b8afc5b3e7a05468e1c566d359f80f13b80cd))
* Chore: Add release script ([#25](https://github.com/prettier/eslint-plugin-prettier/issues/25)) ([8fbfe73](https://github.com/prettier/eslint-plugin-prettier/commit/8fbfe73ec2cdba4c313e9e3add4b602fc3166ab8))

## v2.1.1 (2017-05-19)

* Fix: Support ESLint <3.11.0 ([#24](git@github.com:prettier/eslint-plugin-prettier/issues/24)) ([fde7fdf](git@github.com:prettier/eslint-plugin-prettier/commit/fde7fdf2e2dcb3a1f164e1fddb337070802d2c68))
* Chore: add yarn.lock ([#23](git@github.com:prettier/eslint-plugin-prettier/issues/23)) ([8b55518](git@github.com:prettier/eslint-plugin-prettier/commit/8b555187937a7e37ad84324c4331478b04898493))
* Docs: fix links in changelog ([#22](git@github.com:prettier/eslint-plugin-prettier/issues/22)) ([7e70e11](git@github.com:prettier/eslint-plugin-prettier/commit/7e70e11de37ca77f5aeb3dcdb216e1a421b54f0d))

## v2.1.0 (2017-05-16)

* Merge with eslint-plugin-prettify ([#21](https://github.com/prettier/eslint-plugin-prettier/issues/21)) ([6de494f](https://github.com/prettier/eslint-plugin-prettier/commit/6de494fd685a107f3a9a371e663a1f8d68d6d31f))
* Docs: update repo links to new URL ([#18](https://github.com/prettier/eslint-plugin-prettier/issues/18)) ([6b69492](https://github.com/prettier/eslint-plugin-prettier/commit/6b694928e6e6c192dcb06e6287272fb40cbad17d))
* Chore: Upgrade development dependencies ([#16](https://github.com/prettier/eslint-plugin-prettier/issues/16)) ([12984ea](https://github.com/prettier/eslint-plugin-prettier/commit/12984ead6c46156b25607c9a8b03ae17def7ef9e))
* Docs: fix outdated info about prettier's semicolon support ([da6aad1](https://github.com/prettier/eslint-plugin-prettier/commit/da6aad15ea22aa899b26b5ce0979f4a945d80319))
* Docs: update prettier options in example ([#14](https://github.com/prettier/eslint-plugin-prettier/issues/14)) ([0ae173f](https://github.com/prettier/eslint-plugin-prettier/commit/0ae173f2731b02c0ed72a6cb49efdbdcff54a419))
* Docs: Change the order of dependencies install ([#13](https://github.com/prettier/eslint-plugin-prettier/issues/13)) ([cbf803c](https://github.com/prettier/eslint-plugin-prettier/commit/cbf803ccf0add6e324ae1513b5260e31bf9a3c05))
* Docs: Add CONTRIBUTING.md (fixes [#9](https://github.com/prettier/eslint-plugin-prettier/issues/9)) ([40fe55b](https://github.com/prettier/eslint-plugin-prettier/commit/40fe55b3d8c000787b0dcbfa0aed4f0d930808a9))

## v2.0.1 (2017-02-26)

* Docs: add travis badge to README.md ([1daa495](https://github.com/not-an-aardvark/eslint-plugin-prettier/commit/1daa49558a7f904f8d307d3d434a9bc80f41fee6))
* Upgrade: prettier to 0.18.0 ([1700e41](https://github.com/not-an-aardvark/eslint-plugin-prettier/commit/1700e41b2c66721b521e766052cfaa3cc59cd219))
* Chore: use eslint-config-prettier ([c979b84](https://github.com/not-an-aardvark/eslint-plugin-prettier/commit/c979b84641c42f8870c21c69d22b75916c8511e0))
* Fix: avoid relying on an internal eslint function ([5296930](https://github.com/not-an-aardvark/eslint-plugin-prettier/commit/5296930386ef28a26e0f5c606d107e4293f51620))
* Docs: mention eslint-config-prettier in README.md ([3fd855d](https://github.com/not-an-aardvark/eslint-plugin-prettier/commit/3fd855dfb356c8616c19b51b70eb5fcb8fb90c9c))
* Chore: pin the version of prettier used to lint this module (refs [#1](https://github.com/not-an-aardvark/eslint-plugin-prettier/issues/1)) ([db85633](https://github.com/not-an-aardvark/eslint-plugin-prettier/commit/db85633a0360caeebbf5b20195a3bc19ebf7177a))

## v2.0.0 (2017-01-28)

* Docs: create changelog ([d388095](https://github.com/not-an-aardvark/eslint-plugin-prettier/commit/d388095314f5c23b12df2b210219dca4cb31cb2d))
* Docs: add 2.0.0 migration guide ([db508d7](https://github.com/not-an-aardvark/eslint-plugin-prettier/commit/db508d709c92ce60eee6f9f879af44c8d0b44d1d))
* Breaking: Make prettier a peerDependency ([#1](https://github.com/not-an-aardvark/eslint-plugin-prettier/issues/1)) ([d8a8992](https://github.com/not-an-aardvark/eslint-plugin-prettier/commit/d8a89922ddc6b747c474b62a0948deba6ea2657d))
* Docs: add repo url to package.json ([2474bc9](https://github.com/not-an-aardvark/eslint-plugin-prettier/commit/2474bc9dd3f05dbd0b1fec38e27bc91a9cb0f1c7))
* Docs: suggest prettier-eslint if eslint rules disagree with prettier ([3414437](https://github.com/not-an-aardvark/eslint-plugin-prettier/commit/341443754ae231a17d82f037f8b35663257d282a))
