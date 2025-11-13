// ============================================
// SipSpot Frontend - API Hook
// 通用的API调用Hook，简化数据获取
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useAPI - 基础API调用Hook
 * @param {Function} apiFunc - API调用函数
 * @param {Object} options - 配置选项
 * @param {boolean} options.immediate - 是否立即执行（默认true）
 * @param {Array} options.deps - 依赖数组
 * @param {Function} options.onSuccess - 成功回调
 * @param {Function} options.onError - 错误回调
 * @param {number} options.retryCount - 重试次数（默认0）
 * @param {number} options.retryDelay - 重试延迟（毫秒，默认1000）
 */
export const useAPI = (apiFunc, options = {}) => {
    const {
        immediate = true,
        deps = [],
        onSuccess,
        onError,
        retryCount = 0,
        retryDelay = 1000
    } = options;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(immediate);
    const [error, setError] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const isMountedRef = useRef(true);
    const retryCountRef = useRef(0);
    const abortControllerRef = useRef(null);

    // ============================================
    // 执行API调用
    // ============================================
    const execute = useCallback(async (...args) => {
        try {
            // 取消之前的请求
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            abortControllerRef.current = new AbortController();

            setLoading(true);
            setError(null);
            setIsSuccess(false);

            const result = await apiFunc(...args);

            if (!isMountedRef.current) return;

            // 处理响应
            const responseData = result?.data || result;
            setData(responseData);
            setIsSuccess(true);
            setError(null);

            // 成功回调
            if (onSuccess) {
                onSuccess(responseData);
            }

            // 重置重试计数
            retryCountRef.current = 0;

            return responseData;

        } catch (err) {
            if (!isMountedRef.current) return;

            // 如果是取消请求，不处理错误
            if (err.name === 'AbortError') {
                return;
            }

            setError(err);
            setIsSuccess(false);

            // 错误回调
            if (onError) {
                onError(err);
            }

            // 重试逻辑
            if (retryCountRef.current < retryCount) {
                retryCountRef.current++;
                console.log(`重试第 ${retryCountRef.current} 次...`);

                setTimeout(() => {
                    if (isMountedRef.current) {
                        execute(...args);
                    }
                }, retryDelay);
            }

            throw err;

        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, [apiFunc, onSuccess, onError, retryCount, retryDelay]);

    // ============================================
    // 重置状态
    // ============================================
    const reset = useCallback(() => {
        setData(null);
        setError(null);
        setLoading(false);
        setIsSuccess(false);
        retryCountRef.current = 0;
    }, []);

    // ============================================
    // 自动执行（如果 immediate 为 true）
    // ============================================
    useEffect(() => {
        isMountedRef.current = true;

        if (immediate) {
            execute();
        }

        return () => {
            isMountedRef.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, deps); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        data,
        loading,
        error,
        isSuccess,
        execute,
        reset,
        refetch: execute
    };
};

/**
 * useLazyAPI - 延迟执行的API调用（不自动执行）
 * @param {Function} apiFunc - API调用函数
 * @param {Object} options - 配置选项
 */
export const useLazyAPI = (apiFunc, options = {}) => {
    return useAPI(apiFunc, { ...options, immediate: false });
};

/**
 * usePaginatedAPI - 分页API调用Hook
 * @param {Function} apiFunc - API调用函数
 * @param {Object} initialParams - 初始参数
 */
export const usePaginatedAPI = (apiFunc, initialParams = {}) => {
    const [params, setParams] = useState({
        page: 1,
        limit: 20,
        ...initialParams
    });

    const [allData, setAllData] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    const { data, loading, error, execute } = useAPI(
        () => apiFunc(params),
        {
            immediate: true,
            deps: [params],
            onSuccess: (result) => {
                // 处理分页响应
                const items = result?.data || result || [];
                const pagination = result?.pagination || {};

                if (params.page === 1) {
                    setAllData(items);
                } else {
                    setAllData(prev => [...prev, ...items]);
                }

                setHasMore(pagination.hasNext || false);
                setTotalPages(pagination.pages || 0);
                setTotalCount(pagination.total || 0);
            }
        }
    );

    // 加载下一页
    const loadMore = useCallback(() => {
        if (!loading && hasMore) {
            setParams(prev => ({ ...prev, page: prev.page + 1 }));
        }
    }, [loading, hasMore]);

    // 跳转到指定页
    const goToPage = useCallback((page) => {
        setParams(prev => ({ ...prev, page }));
    }, []);

    // 修改每页数量
    const changeLimit = useCallback((limit) => {
        setParams(prev => ({ ...prev, page: 1, limit }));
        setAllData([]);
    }, []);

    // 重置并刷新
    const refresh = useCallback(() => {
        setParams(prev => ({ ...prev, page: 1 }));
        setAllData([]);
    }, []);

    // 更新过滤参数
    const updateFilters = useCallback((newFilters) => {
        setParams(prev => ({ ...prev, ...newFilters, page: 1 }));
        setAllData([]);
    }, []);

    return {
        data: allData,
        currentPageData: data?.data || data || [],
        loading,
        error,
        hasMore,
        page: params.page,
        limit: params.limit,
        totalPages,
        totalCount,
        loadMore,
        goToPage,
        changeLimit,
        refresh,
        updateFilters,
        refetch: execute
    };
};

/**
 * useCachedAPI - 带缓存的API调用Hook
 * @param {string} cacheKey - 缓存键
 * @param {Function} apiFunc - API调用函数
 * @param {Object} options - 配置选项
 * @param {number} options.cacheTime - 缓存时间（毫秒，默认5分钟）
 */
export const useCachedAPI = (cacheKey, apiFunc, options = {}) => {
    const { cacheTime = 5 * 60 * 1000, ...restOptions } = options;

    const [cachedData, setCachedData] = useState(() => {
        try {
            const cached = sessionStorage.getItem(cacheKey);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                const isExpired = Date.now() - timestamp > cacheTime;
                if (!isExpired) {
                    return data;
                }
            }
        } catch (err) {
            console.error('Failed to load cached data:', err);
        }
        return null;
    });

    const apiHook = useAPI(apiFunc, {
        ...restOptions,
        immediate: cachedData === null,
        onSuccess: (data) => {
            try {
                sessionStorage.setItem(
                    cacheKey,
                    JSON.stringify({ data, timestamp: Date.now() })
                );
                setCachedData(data);
            } catch (err) {
                console.error('Failed to cache data:', err);
            }

            if (restOptions.onSuccess) {
                restOptions.onSuccess(data);
            }
        }
    });

    // 清除缓存
    const clearCache = useCallback(() => {
        try {
            sessionStorage.removeItem(cacheKey);
            setCachedData(null);
        } catch (err) {
            console.error('Failed to clear cache:', err);
        }
    }, [cacheKey]);

    return {
        ...apiHook,
        data: cachedData || apiHook.data,
        clearCache
    };
};

/**
 * useMultipleAPIs - 并行执行多个API调用
 * @param {Array} apiFuncs - API函数数组
 * @param {Object} options - 配置选项
 */
export const useMultipleAPIs = (apiFuncs, options = {}) => {
    const { immediate = true, deps = [] } = options;

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(immediate);
    const [errors, setErrors] = useState([]);
    const [isSuccess, setIsSuccess] = useState(false);

    const isMountedRef = useRef(true);

    const execute = useCallback(async () => {
        try {
            setLoading(true);
            setErrors([]);
            setIsSuccess(false);

            const results = await Promise.allSettled(
                apiFuncs.map(func => func())
            );

            if (!isMountedRef.current) return;

            const successData = [];
            const errorList = [];

            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    successData.push(result.value?.data || result.value);
                } else {
                    errorList.push({
                        index,
                        error: result.reason
                    });
                }
            });

            setData(successData);
            setErrors(errorList);
            setIsSuccess(errorList.length === 0);

            return successData;

        } catch (err) {
            if (!isMountedRef.current) return;
            setErrors([{ error: err }]);
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, [apiFuncs]);

    useEffect(() => {
        isMountedRef.current = true;

        if (immediate) {
            execute();
        }

        return () => {
            isMountedRef.current = false;
        };
    }, deps); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        data,
        loading,
        errors,
        isSuccess,
        hasErrors: errors.length > 0,
        execute,
        refetch: execute
    };
};

/**
 * useMutation - 用于数据修改的Hook（POST、PUT、DELETE等）
 * @param {Function} mutationFunc - 修改操作函数
 * @param {Object} options - 配置选项
 */
export const useMutation = (mutationFunc, options = {}) => {
    const {
        onSuccess,
        onError,
        onSettled // 无论成功失败都会调用
    } = options;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const mutate = useCallback(async (variables) => {
        try {
            setLoading(true);
            setError(null);
            setIsSuccess(false);

            const result = await mutationFunc(variables);

            if (!isMountedRef.current) return;

            const responseData = result?.data || result;
            setData(responseData);
            setIsSuccess(true);

            if (onSuccess) {
                onSuccess(responseData, variables);
            }

            return responseData;

        } catch (err) {
            if (!isMountedRef.current) return;

            setError(err);
            setIsSuccess(false);

            if (onError) {
                onError(err, variables);
            }

            throw err;

        } finally {
            if (isMountedRef.current) {
                setLoading(false);

                if (onSettled) {
                    onSettled();
                }
            }
        }
    }, [mutationFunc, onSuccess, onError, onSettled]);

    const reset = useCallback(() => {
        setData(null);
        setError(null);
        setLoading(false);
        setIsSuccess(false);
    }, []);

    return {
        mutate,
        data,
        loading,
        error,
        isSuccess,
        reset
    };
};

export default useAPI;