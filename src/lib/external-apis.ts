/**
 * External API Integrations for CrisisLens
 * Weather, Emergency Services, News, Social Media monitoring
 */

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  conditions: string;
  heatIndex: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
  timestamp: string;
}

interface EmergencyAlert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'extreme';
  category: string;
  areas: string[];
  issuedAt: string;
  expiresAt?: string;
  source: string;
}

interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: string;
  publishedAt: string;
  relevanceScore: number;
  crisisKeywords: string[];
  location?: string;
}

interface SocialPost {
  id: string;
  content: string;
  author: string;
  platform: string;
  publishedAt: string;
  relevanceScore: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  location?: string;
  crisisIndicators: string[];
}

// Weather API Integration
export class WeatherService {
  private apiKey: string;
  private baseUrl = 'https://api.openweathermap.org/data/2.5';

  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY || '';
  }

  async getCurrentWeather(regionName: string, lat: number, lng: number): Promise<WeatherData> {
    if (!this.apiKey) {
      throw new Error('OpenWeather API key not configured');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/weather?lat=${lat}&lon=${lng}&appid=${this.apiKey}&units=metric`
      );
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        temperature: data.main.temp,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        conditions: data.weather[0].main,
        heatIndex: this.calculateHeatIndex(data.main.temp, data.main.humidity),
        pressure: data.main.pressure,
        visibility: data.visibility / 1000, // Convert to km
        uvIndex: data.uvi || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Weather API error:', error);
      throw error;
    }
  }

  async getWeatherForecast(lat: number, lng: number, days: number = 5): Promise<any[]> {
    if (!this.apiKey) {
      throw new Error('OpenWeather API key not configured');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/forecast?lat=${lat}&lon=${lng}&appid=${this.apiKey}&units=metric&cnt=${days * 8}`
      );
      
      if (!response.ok) {
        throw new Error(`Weather forecast API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.list.map((item: any) => ({
        timestamp: new Date(item.dt * 1000).toISOString(),
        temperature: item.main.temp,
        humidity: item.main.humidity,
        conditions: item.weather[0].main,
        precipitation: item.pop * 100,
        windSpeed: item.wind.speed
      }));
    } catch (error) {
      console.error('Weather forecast API error:', error);
      throw error;
    }
  }

  private calculateHeatIndex(temp: number, humidity: number): number {
    // Heat index calculation (simplified)
    if (temp < 27) return temp;
    
    const hi = -42.379 +
      2.04901523 * temp +
      10.14333127 * humidity -
      0.22475541 * temp * humidity -
      0.00683783 * temp * temp -
      0.05481717 * humidity * humidity +
      0.00122874 * temp * temp * humidity +
      0.00085282 * temp * humidity * humidity -
      0.00000199 * temp * temp * humidity * humidity;
    
    return Math.round(hi);
  }
}

// Emergency Services API Integration
export class EmergencyService {
  private apiKey: string;
  private baseUrl = process.env.EMERGENCY_API_URL || 'https://api.emergency-services.gov';

  constructor() {
    this.apiKey = process.env.EMERGENCY_API_KEY || '';
  }

  async getActiveAlerts(regionId?: string): Promise<EmergencyAlert[]> {
    if (!this.apiKey) {
      // Return mock data for demo
      return this.getMockAlerts();
    }

    try {
      const url = regionId 
        ? `${this.baseUrl}/alerts?region=${regionId}`
        : `${this.baseUrl}/alerts`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Emergency API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.alerts.map((alert: any) => ({
        id: alert.id,
        title: alert.title,
        description: alert.description,
        severity: alert.severity,
        category: alert.category,
        areas: alert.areas,
        issuedAt: alert.issued_at,
        expiresAt: alert.expires_at,
        source: alert.source
      }));
    } catch (error) {
      console.error('Emergency API error:', error);
      return this.getMockAlerts();
    }
  }

  private getMockAlerts(): EmergencyAlert[] {
    return [
      {
        id: 'alert-1',
        title: 'Flash Flood Warning',
        description: 'Flash flooding expected in low-lying areas',
        severity: 'high',
        category: 'weather',
        areas: ['North District', 'East District'],
        issuedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        source: 'National Weather Service'
      },
      {
        id: 'alert-2',
        title: 'Heat Advisory',
        description: 'High temperatures expected, stay hydrated',
        severity: 'medium',
        category: 'health',
        areas: ['South District', 'Central District'],
        issuedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        source: 'Health Department'
      }
    ];
  }

  async submitAlert(alert: Partial<EmergencyAlert>): Promise<EmergencyAlert> {
    // In production, this would submit to emergency services
    const newAlert: EmergencyAlert = {
      id: `alert-${Date.now()}`,
      title: alert.title || 'Emergency Alert',
      description: alert.description || '',
      severity: alert.severity || 'medium',
      category: alert.category || 'general',
      areas: alert.areas || [],
      issuedAt: new Date().toISOString(),
      source: 'CrisisLens System'
    };

    return newAlert;
  }
}

// News Monitoring Service
export class NewsService {
  private apiKey: string;
  private baseUrl = 'https://newsapi.org/v2';

  constructor() {
    this.apiKey = process.env.NEWS_API_KEY || '';
  }

  async searchCrisisNews(keywords: string[], region?: string): Promise<NewsItem[]> {
    if (!this.apiKey) {
      return this.getMockNews(keywords);
    }

    try {
      const query = keywords.join(' OR ') + (region ? ` AND ${region}` : '');
      const response = await fetch(
        `${this.baseUrl}/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=20`,
        {
          headers: {
            'X-API-Key': this.apiKey
          }
        }
      );

      if (!response.ok) {
        throw new Error(`News API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.articles.map((article: any) => ({
        id: `news-${article.source.id}-${Date.now()}`,
        title: article.title,
        content: article.description || article.content,
        source: article.source.name,
        publishedAt: article.publishedAt,
        relevanceScore: this.calculateRelevanceScore(article.title + ' ' + (article.description || ''), keywords),
        crisisKeywords: keywords.filter(keyword => 
          (article.title + ' ' + (article.description || '')).toLowerCase().includes(keyword.toLowerCase())
        )
      }));
    } catch (error) {
      console.error('News API error:', error);
      return this.getMockNews(keywords);
    }
  }

  private getMockNews(keywords: string[]): NewsItem[] {
    return [
      {
        id: 'news-1',
        title: 'Heavy Rain Causes Flooding in Northern Areas',
        content: 'Authorities respond to flooding reports as heavy rainfall continues.',
        source: 'Local News Network',
        publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        relevanceScore: 0.85,
        crisisKeywords: ['flood', 'rain']
      },
      {
        id: 'news-2',
        title: 'Heat Wave Alert Issued for Region',
        content: 'Health officials warn residents about extreme temperatures.',
        source: 'Weather Channel',
        publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        relevanceScore: 0.72,
        crisisKeywords: ['heat', 'temperature']
      }
    ];
  }

  private calculateRelevanceScore(content: string, keywords: string[]): number {
    const contentLower = content.toLowerCase();
    const keywordMatches = keywords.filter(keyword => 
      contentLower.includes(keyword.toLowerCase())
    ).length;
    return Math.min(1, keywordMatches / keywords.length + 0.2);
  }
}

// Social Media Monitoring Service
export class SocialMediaService {
  private apiKey: string;
  private baseUrl = process.env.SOCIAL_MEDIA_API_URL || 'https://api.social-monitor.com';

  constructor() {
    this.apiKey = process.env.SOCIAL_MEDIA_API_KEY || '';
  }

  async searchCrisisPosts(keywords: string[], region?: string): Promise<SocialPost[]> {
    if (!this.apiKey) {
      return this.getMockSocialPosts(keywords);
    }

    try {
      const query = keywords.join(' OR ') + (region ? ` near:${region}` : '');
      const response = await fetch(
        `${this.baseUrl}/search?q=${encodeURIComponent(query)}&limit=50`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Social Media API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.posts.map((post: any) => ({
        id: post.id,
        content: post.text,
        author: post.username,
        platform: post.platform,
        publishedAt: post.created_at,
        relevanceScore: this.calculateRelevanceScore(post.text, keywords),
        sentiment: this.analyzeSentiment(post.text),
        location: post.location,
        crisisIndicators: this.extractCrisisIndicators(post.text, keywords)
      }));
    } catch (error) {
      console.error('Social Media API error:', error);
      return this.getMockSocialPosts(keywords);
    }
  }

  private getMockSocialPosts(keywords: string[]): SocialPost[] {
    return [
      {
        id: 'social-1',
        content: 'Street flooding here in North District, cars stuck in water! #flood #emergency',
        author: 'local_resident',
        platform: 'twitter',
        publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        relevanceScore: 0.9,
        sentiment: 'negative',
        location: 'North District',
        crisisIndicators: ['flood', 'emergency', 'stuck']
      },
      {
        id: 'social-2',
        content: 'This heat is unbearable, staying indoors with AC on full blast #heatwave',
        author: 'city_dweller',
        platform: 'twitter',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        relevanceScore: 0.75,
        sentiment: 'negative',
        location: 'Central District',
        crisisIndicators: ['heat', 'unbearable']
      }
    ];
  }

  private calculateRelevanceScore(content: string, keywords: string[]): number {
    const contentLower = content.toLowerCase();
    const keywordMatches = keywords.filter(keyword => 
      contentLower.includes(keyword.toLowerCase())
    ).length;
    
    // Bonus for crisis indicators
    const crisisIndicators = ['emergency', 'danger', 'help', 'stuck', 'flooded', 'evacuate'];
    const indicatorMatches = crisisIndicators.filter(indicator => 
      contentLower.includes(indicator)
    ).length;
    
    return Math.min(1, (keywordMatches / keywords.length) + (indicatorMatches * 0.1) + 0.1);
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const negativeWords = ['bad', 'terrible', 'awful', 'danger', 'emergency', 'stuck', 'flooded', 'help'];
    const positiveWords = ['good', 'safe', 'okay', 'fine', 'helped', 'resolved'];
    
    const textLower = text.toLowerCase();
    const negativeCount = negativeWords.filter(word => textLower.includes(word)).length;
    const positiveCount = positiveWords.filter(word => textLower.includes(word)).length;
    
    if (negativeCount > positiveCount) return 'negative';
    if (positiveCount > negativeCount) return 'positive';
    return 'neutral';
  }

  private extractCrisisIndicators(text: string, keywords: string[]): string[] {
    const indicators = ['emergency', 'danger', 'help', 'stuck', 'flooded', 'evacuate', 'injured', 'blocked'];
    const textLower = text.toLowerCase();
    
    return indicators.filter(indicator => textLower.includes(indicator));
  }
}

// Main External Data Manager
export class ExternalDataManager {
  private weatherService: WeatherService;
  private emergencyService: EmergencyService;
  private newsService: NewsService;
  private socialMediaService: SocialMediaService;

  constructor() {
    this.weatherService = new WeatherService();
    this.emergencyService = new EmergencyService();
    this.newsService = new NewsService();
    this.socialMediaService = new SocialMediaService();
  }

  async collectAllExternalData(regionId: string, regionName: string, lat: number, lng: number) {
    try {
      const [weather, alerts, news, socialPosts] = await Promise.allSettled([
        this.weatherService.getCurrentWeather(regionName, lat, lng),
        this.emergencyService.getActiveAlerts(regionId),
        this.newsService.searchCrisisNews(['flood', 'heat', 'emergency', 'crisis'], regionName),
        this.socialMediaService.searchCrisisPosts(['flood', 'heat', 'emergency', 'danger'], regionName)
      ]);

      return {
        weather: weather.status === 'fulfilled' ? weather.value : null,
        alerts: alerts.status === 'fulfilled' ? alerts.value : [],
        news: news.status === 'fulfilled' ? news.value : [],
        socialPosts: socialPosts.status === 'fulfilled' ? socialPosts.value : [],
        collectedAt: new Date().toISOString(),
        regionId,
        regionName
      };
    } catch (error) {
      console.error('Error collecting external data:', error);
      throw error;
    }
  }

  async analyzeCrisisSignals(data: ReturnType<typeof this.collectAllExternalData> extends Promise<infer T> ? T : never) {
    if (!data) return { signals: [], severity: 'low' };

    const signals = [];
    let totalSeverity = 0;

    // Analyze weather data
    if (data.weather) {
      if (data.weather.temperature > 35) {
        signals.push({
          type: 'extreme_heat',
          severity: 'high',
          source: 'weather',
          description: `Extreme temperature: ${data.weather.temperature}°C`
        });
        totalSeverity += 3;
      }
      
      if (data.weather.heatIndex > 40) {
        signals.push({
          type: 'heat_advisory',
          severity: 'medium',
          source: 'weather',
          description: `High heat index: ${data.weather.heatIndex}°C`
        });
        totalSeverity += 2;
      }
    }

    // Analyze emergency alerts
    data.alerts.forEach(alert => {
      const severityMap = { low: 1, medium: 2, high: 3, extreme: 4 };
      signals.push({
        type: 'emergency_alert',
        severity: alert.severity,
        source: 'emergency_services',
        description: alert.title,
        details: alert.description
      });
      totalSeverity += severityMap[alert.severity as keyof typeof severityMap] || 1;
    });

    // Analyze news relevance
    const highRelevanceNews = data.news.filter(item => item.relevanceScore > 0.7);
    if (highRelevanceNews.length > 0) {
      signals.push({
        type: 'news_coverage',
        severity: 'medium',
        source: 'news',
        description: `${highRelevanceNews.length} relevant news items`,
        details: highRelevanceNews.map(item => item.title).slice(0, 3)
      });
      totalSeverity += highRelevanceNews.length;
    }

    // Analyze social media sentiment
    const negativePosts = data.socialPosts.filter(post => post.sentiment === 'negative');
    const highRelevancePosts = data.socialPosts.filter(post => post.relevanceScore > 0.8);
    
    if (highRelevancePosts.length > 3) {
      signals.push({
        type: 'social_concern',
        severity: negativePosts.length > highRelevancePosts.length / 2 ? 'high' : 'medium',
        source: 'social_media',
        description: `${highRelevancePosts.length} relevant social posts`,
        details: `${negativePosts.length} negative sentiment`
      });
      totalSeverity += negativePosts.length > 0 ? 2 : 1;
    }

    // Calculate overall severity
    let overallSeverity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (totalSeverity >= 8) overallSeverity = 'critical';
    else if (totalSeverity >= 5) overallSeverity = 'high';
    else if (totalSeverity >= 2) overallSeverity = 'medium';

    return {
      signals,
      severity: overallSeverity,
      totalSeverity,
      summary: `Detected ${signals.length} crisis signals with ${overallSeverity} severity`
    };
  }
}

// Export singleton instance
export const externalDataManager = new ExternalDataManager();
