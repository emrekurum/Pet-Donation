module.exports = {
  // Projenin kök dizininde olduğumuzu belirtir, ESLint'in üst dizinlerdeki yapılandırma dosyalarını aramasını engeller.
  root: true,

  // Temel yapılandırma olarak @react-native topluluğunun ESLint kurallarını kullanır.
  // Bu genellikle React Native projeleri için iyi bir başlangıç noktasıdır.
  extends: [
    '@react-native',
    'plugin:prettier/recommended', // Prettier kurallarını ESLint'e entegre eder ve çakışan ESLint kurallarını kapatır.
  ],

  // Kodunuzu ayrıştırmak (parse etmek) için @babel/eslint-parser kullanılır.
  // Bu, modern JavaScript özelliklerini ve Babel tarafından işlenen kodu anlamasına yardımcı olur.
  parser: '@babel/eslint-parser',

  parserOptions: {
    // ESLint'in Babel parser'ının ayrı bir babel.config.js dosyası aramasını engeller (requireConfigFile: false).
    // Bunun yerine, aşağıdaki babelOptions kullanılır.
    requireConfigFile: false,
    ecmaFeatures: {
      // JSX sözdizimini etkinleştirir. @react-native zaten bunu yapabilir ama açıkça belirtmek zarar vermez.
      jsx: true,
    },
    ecmaVersion: 'latest', // En son ECMAScript özelliklerini destekler
    sourceType: 'module', // ES modüllerini kullanmamıza izin verir (import/export)

    // ESLint'in kullandığı @babel/eslint-parser için özel Babel seçenekleri.
    // Bu, ESLint'in kodunuzu projenizin ana Babel yapılandırmasına benzer şekilde anlamasına yardımcı olur.
    babelOptions: {
      // Projenizin ana babel.config.js dosyasında kullanılan preset'lerle tutarlı olmalıdır.
      // Güncel React Native versiyonları için 'module:@react-native/babel-preset' kullanılır.
      presets: ['module:@react-native/babel-preset'],
      // 'react-native-dotenv' eklentisi kaldırılmıştı.
      plugins: [
        // Projenizin kullandığı diğer Babel plugin'leri varsa ve ESLint'in bunları bilmesi gerekiyorsa buraya eklenebilir.
      ],
    },
  },

  // Projenize özel ESLint kurallarını burada tanımlayabilir veya mevcut kuralları geçersiz kılabilirsiniz.
  rules: {
    // Prettier ile ilgili tüm formatlama hatalarını ESLint hatası olarak göstermek için.
    // Bu kural, extends bölümündeki 'plugin:prettier/recommended' ile birlikte çalışır.
    // İsterseniz burada Prettier seçeneklerini de override edebilirsiniz.
    'prettier/prettier': [
      'error',
      {
        // Proje genelinde kullanılacak Prettier ayarları:
        endOfLine: 'lf', // Satır sonlarını LF (Unix stili) olarak zorunlu kıl (CRLF sorunlarını çözer).
        singleQuote: true, // String ifadeler için tek tırnak kullanılmasını zorunlu kıl.
        trailingComma: 'es5', // ES5 uyumlu yerlerde (objeler, diziler vb.) sona virgül ekle.
        printWidth: 80, // Satır uzunluğu limiti.
        tabWidth: 2, // Tab genişliği.
        useTabs: false, // Tab yerine boşluk kullan.
        semi: true, // Satır sonlarına noktalı virgül ekle.
        jsxSingleQuote: true, // JSX içinde string'ler için tek tırnak kullan.
        bracketSpacing: true, // Obje literallerinde parantez içlerinde boşluk bırak: { foo: bar }.
        arrowParens: 'always', // Arrow fonksiyon parametrelerinde her zaman parantez kullan: (x) => x.
      },
    ],

    // Örnek: Kullanılmayan değişkenler için uyarı (varsayılan olarak @react-native'de olabilir)
    // 'no-unused-vars': 'warn',

    // ESLint'in kendi tırnak kuralını Prettier ile çakışmaması için kapatabilir veya Prettier'a uygun ayarlayabilirsiniz.
    // 'plugin:prettier/recommended' bunu genellikle otomatik yapar.
    // quotes: ['error', 'single', { avoidEscape: true }], // Bu satır 'prettier/prettier' ile yönetildiği için gereksiz olabilir.

    // Gereksiz kaçış karakterlerini engellemek için ESLint kuralı (genellikle varsayılan olarak etkindir)
    'no-useless-escape': 'warn',
  },

  settings: {
    // Eğer eslint-plugin-import kullanıyorsanız ve modül çözümlemesiyle ilgili sorunlar yaşıyorsanız,
    // resolver ayarlarını burada yapabilirsiniz.
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
};
