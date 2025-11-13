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

    // 🔧 新增：使用 ref 固定 apiFunc，避免匿名函数导致 useCallback 无限重建
    const apiFuncRef = useRef(apiFunc); // 🔧 修改
    apiFuncRef.current = apiFunc;       // 🔧 修改

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

            // 🔧 修改：改为使用 apiFuncRef.current，而不是 apiFunc
            const result = await apiFuncRef.current(...args); // 🔧 修改

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
        // 🔧 修改：移除 apiFunc 依赖，避免无限循环
    }, [onSuccess, onError, retryCount, retryDelay]); // 🔧 修改

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
    // 🔧 注意：这里我们不动，因为你明确要求不要更改其他逻辑

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

// 下面部分全部保持不动（你要求的）
// ============================================
// 其余 Hook 未被修改
// ============================================

export const useLazyAPI = (apiFunc, options = {}) => {
    return useAPI(apiFunc, { ...options, immediate: false });
};

export const usePaginatedAPI = (apiFunc, initialParams = {}) => {
    // ...（完全不动）
};

export const useCachedAPI = (cacheKey, apiFunc, options = {}) => {
    // ...（完全不动）
};

export const useMultipleAPIs = (apiFuncs, options = {}) => {
    // ...（完全不动）
};

export const useMutation = (mutationFunc, options = {}) => {
    // ...（完全不动）
};

export default useAPI;
